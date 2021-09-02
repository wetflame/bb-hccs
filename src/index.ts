import { canAdv } from 'canadv.ash';
import {
    abort,
    adv1,
    autosell,
    availableAmount,
    buy,
    chatPrivate,
    chew,
    cliExecute,
    containsText,
    drink,
    eat,
    equip,
    familiarWeight,
    gametimeToInt,
    getProperty,
    haveEffect,
    haveFamiliar,
    haveSkill,
    inMultiFight,
    maximize,
    myAdventures,
    myBasestat,
    myBuffedstat,
    myClass,
    myFamiliar,
    myFullness,
    myHp,
    myInebriety,
    myLevel,
    myMaxhp,
    myMp,
    mySpleenUse,
    myTurncount,
    numericModifier,
    print,
    putShop,
    restoreHp,
    runChoice,
    runCombat,
    setAutoAttack,
    setProperty,
    toInt,
    use,
    useFamiliar,
    userConfirm,
    useSkill,
    visitUrl,
    wait,
    weightAdjustment,
} from 'kolmafia';
import {
    $class,
    $effect,
    $familiar,
    $item,
    $location,
    $monster,
    $skill,
    $slot,
    $stat,
    adventureMacro,
    get,
    Macro,
    Mood,
    set,
} from 'libram';
import {
    adventureWithCarolGhost,
    eatPizza,
    ensureCreateItem,
    ensureEffect,
    ensureItem,
    ensureNpcEffect,
    ensurePotionEffect,
    ensurePullEffect,
    ensureSewerItem,
    ensureSong,
    getPropertyBoolean,
    getPropertyInt,
    mapAndSaberMonster,
    myFamiliarWeight,
    pullIfPossible,
    sausageFightGuaranteed,
    setChoice,
    setClan,
    setPropertyInt,
    tryUse,
    wishEffect,
} from './lib';

enum Test {
    HP = 1,
    MUS = 2,
    MYS = 3,
    MOX = 4,
    FAMILIAR = 5,
    WEAPON = 6,
    SPELL = 7,
    NONCOMBAT = 8,
    ITEM = 9,
    HOT_RES = 10,
    COIL_WIRE = 11,
    DONATE = 30,
}

interface turnsObject {
    [key: number]: number;
}

const desiredTurns: turnsObject = {
    [Test.HP]: 1,
    [Test.MUS]: 1,
    [Test.MYS]: 1,
    [Test.MOX]: 1,
    [Test.ITEM]: 2,
    [Test.WEAPON]: 60,
    [Test.HOT_RES]: 60,
    [Test.SPELL]: 60,
    [Test.NONCOMBAT]: 1,
    [Test.FAMILIAR]: 60,
    [Test.COIL_WIRE]: 60,
};

interface predObject {
    [key: number]: Function;
}

const testTurnPredictions: predObject = {
    [Test.COIL_WIRE]: () => { return 60; },
    [Test.HP]: () => {
        return 60 - Math.floor((myMaxhp() - myBuffedstat($stat`muscle`) - 3) / 30);
    },
    [Test.MUS]: () => {
        return 60 - Math.floor((1 / 30) * (myBuffedstat($stat`muscle`) - myBasestat($stat`muscle`)));
    },
    [Test.MOX]: () => {
        return 60 - Math.floor((1 / 30) * (myBuffedstat($stat`moxie`) - myBasestat($stat`moxie`)));
    },
    [Test.MYS]: () => {
        return (
            60 -
            Math.floor((1 / 30) * (myBuffedstat($stat`mysticality`) - myBasestat($stat`mysticality`)))
        );
    },
    [Test.ITEM]: () => {
        return (
            60 -
            Math.floor(numericModifier('item drop') / 30 + 0.001) -
            Math.floor(numericModifier('booze drop') / 15 + 0.001)
        );
    },
    [Test.HOT_RES]: () => {
        return 60 - numericModifier('hot resistance');
    },
    [Test.NONCOMBAT]: () => {
        return 60 + (20 + numericModifier('combat rate')) * 3;
    },
    [Test.FAMILIAR]: () => {
        return 60 - Math.floor((familiarWeight(myFamiliar()) + weightAdjustment()) / 5);
    },
    [Test.WEAPON]: () => {
        return (
            60 -
            Math.floor(numericModifier('weapon damage') / 25 + 0.001) -
            Math.floor(numericModifier('weapon damage percent') / 25 + 0.001)
        );
    },
    [Test.SPELL]: () => {
        return (
            60 -
            Math.floor(numericModifier('spell damage') / 50 + 0.001) -
            Math.floor(numericModifier('spell damage percent') / 50 + 0.001)
        );
    },
};

function upkeepHpAndMp() {
    if (myHp() < 0.8 * myMaxhp()) {
        cliExecute('hottub');
    }
    if (myMp() < 500) {
        eat($item`magical sausage`);
    }
}

function doGuaranteedGoblin() {
    // kill a kramco for the sausage before coiling wire
    if (sausageFightGuaranteed()) {
        equip($item`Kramco Sausage-o-Matic™`);
        adventureMacro(
            $location`Noob Cave`,
            Macro.if_('!monstername "sausage goblin"', new Macro().step('abort'))
                .skill($skill`Saucestorm`)
                .repeat()
        );
    }
}

function testDone(testNum: number) {
    print(`Checking test ${testNum}...`);
    const text = visitUrl('council.php');
    return !containsText(text, `<input type=hidden name=option value=${testNum}>`);
}

function doTest(testNum: Test) {
    doGuaranteedGoblin();
    if (!testDone(testNum)) {
        let predictedTurns = 60;
        if (testNum !== Test.DONATE) {
            predictedTurns = testTurnPredictions[testNum]();
            if (predictedTurns > desiredTurns[testNum]) abort('test taking too long');

            while (predictedTurns > myAdventures()) {
                eat(1, $item`magical sausage`);
            }
        }
        set(`_hccsTestExpected${testNum}`, predictedTurns);
        const turnsBeforeTest = myTurncount();
        visitUrl(`choice.php?whichchoice=1089&option=${testNum}`);
        if (!testDone(testNum)) {
            throw `Failed to do test ${Test[testNum]}. Maybe we are out of turns.`;
        }

        set(`_hccsTestActual${testNum}`, myTurncount() - turnsBeforeTest);
    } else {
        print(`Test ${testNum} already completed.`);
    }
}

const getBatteries = () => {
    // use the power plant
    cliExecute("inv_use.php?pwd&whichitem=10738");

    for (let i = 1; i < 8; i++) {
        cliExecute(`choice.php?pwd&whichchoice=1448&option=1&pp=${i}`);
    }
};

function setup() {
    if (availableAmount($item`blood-faced volleyball`) > 0) return;

    setPropertyInt('bb_ScriptStartCS', gametimeToInt());

    // Sell pork gems + tent
    visitUrl('tutorial.php?action=toot');
    tryUse(1, $item`letter from King Ralph XI`);
    tryUse(1, $item`pork elf goodies sack`);
    autosell(5, $item`baconstone`);
    autosell(5, $item`porquoise`);
    autosell(5, $item`hamethyst`);

    setClan('Old CW\'s Germ Free Clan');

    // Do buy stuff from NPC stores and coinmasters.
    setProperty('_saved_autoSatisfyWithNPCs', getProperty('autoSatisfyWithNPCs'));
    setProperty('autoSatisfyWithNPCs', 'true');
    setProperty('_saved_autoSatisfyWithCoinmasters', getProperty('autoSatisfyWithCoinmasters'));
    setProperty('autoSatisfyWithCoinmasters', 'true');

    // Initialize council.
    visitUrl('council.php');

    // manual visit to fireworks shop to allow purchases
    visitUrl('clan_viplounge.php?action=fwshop');

    cliExecute('mood apathetic');

    // All combat handled by our consult script (hccs_combat.ash).
    cliExecute('ccs bean-hccs');

    // Turn off Lil' Doctor quests.
    setChoice(1340, 3);
    setChoice(1387, 3); // set saber choice

    // fiddle with backup camera (reverser and ML)
    cliExecute('backupcamera reverser on');
    cliExecute('backupcamera ml');

    // Upgrade saber for fam wt
    visitUrl('main.php?action=may4');
    runChoice(4);

    // pull and use borrowed time
    if (availableAmount($item`borrowed time`) === 0 && !get('_borrowedTimeUsed')) {
        if (pullIfPossible(1, $item`borrowed time`, 20000)) {
            use($item`borrowed time`);
        } else {
            abort("Couldn't get borrowed time");
        }
    }

    // cliExecute('boombox fists');
    cliExecute('mcd 10');

    ensureItem(1, $item`toy accordion`);

    // lathe wand
    // visitUrl('shop.php?whichshop=lathe&action=buyitem&quantity=1&whichrow=1162&pwd');

    if (!get('_floundryItemCreated')) {
        cliExecute('acquire fish hatchet');
    }

    autosell(1, $item`Newbiesport™ tent`);

    // get clan consults
    if (!get('_hccsMinRealTime')) {
        getBatteries();

        // Visiting Looking Glass in clan VIP lounge
        visitUrl('clan_viplounge.php?action=lookingglass&whichfloor=2');
        while (getPropertyInt('_genieWishesUsed') < 3) {
            cliExecute('genie wish for more wishes');
        }

        // get blood-faced volleyball
        cliExecute('acquire seal tooth');
        cliExecute('acquire volleyball');
        use($item`seal tooth`);
        use($item`volleyball`);
    }
}

function getPizzaIngredients() {
    if (availableAmount($item`cherry`) > 0) return;

    setProperty('choiceAdventure1387', '3'); // set saber to drop items

    // Put on some regen gear
    equip($item`Fourth of May Cosplay Saber`);
    equip($item`familiar scrapbook`); // maxmize scrap drops during saber YRs
    equip($item`Cargo Cultist Shorts`);
    equip($item`unwrapped knock-off retro superhero cape`);
    equip($slot`acc1`, $item`Beach Comb`);
    equip($slot`acc2`, $item`hewn moon-rune spoon`);

    useFamiliar($familiar`Plastic Pirate Skull`); // maxmize scrap drops

    mapAndSaberMonster($location`The Haunted Kitchen`, $monster`possessed silverware drawer`);

    // Saber tomato (reagent potion)
    mapAndSaberMonster($location`The Haunted Pantry`, $monster`possessed can of tomatoes`);

    // Cherry and grapefruit in skeleton store (Saber YR)
    if (getProperty('questM23Meatsmith') === 'unstarted') {
        visitUrl('shop.php?whichshop=meatsmith&action=talk');
        runChoice(1);
    }
    if (!canAdv($location`The Skeleton Store`, false)) throw 'Cannot open skeleton store!';
    adv1($location`The Skeleton Store`, -1, '');
    if (!containsText($location`The Skeleton Store`.noncombatQueue, 'Skeletons In Store')) {
        throw 'Something went wrong at skeleton store.';
    }
    mapAndSaberMonster($location`The Skeleton Store`, $monster`novelty tropical skeleton`);
    autosell(availableAmount($item`lemon`), $item`lemon`);
    autosell(availableAmount($item`strawberry`), $item`strawberry`);
    autosell(availableAmount($item`orange`), $item`orange`);
}

function useStatGains() {
    if (get('getawayCampsiteUnlocked') && haveEffect($effect`That's Just Cloud-Talk, Man`) === 0) {
        visitUrl('place.php?whichplace=campaway&action=campaway_sky');
    }

    ensureEffect($effect`Inscrutable Gaze`);
    ensureEffect($effect`Thaumodynamic`);
    ensurePullEffect($effect`Category`, $item`abstraction: category`);
    ensurePullEffect($effect`Different Way of Seeing Things`, $item`non-Euclidean angle`);

    equip($item`familiar scrapbook`); // make use of exp boosts

    // if (Math.round(numericModifier('mysticality experience percent')) < 125) {
    //     throw 'Insufficient +stat%.';
    // }

    // Use ten-percent bonus
    tryUse(1, $item`a ten-percent bonus`);

    // Scavenge for gym equipment
    if (toInt(get('_daycareGymScavenges')) < 1) {
        visitUrl('/place.php?whichplace=town_wrong&action=townwrong_boxingdaycare');
        const pg = runChoice(3);
        if (containsText(pg, '[free]')) runChoice(2);
        runChoice(5);
        runChoice(4);
    }
}

function buffBeforeGoblins() {
    // MAL pizza
    if (!haveEffect($effect`Mallowed Out`)) {
        // pull giant pearl to ensure 100 turns
        if (availableAmount($item`giant pearl`) === 0 && !haveEffect($effect`Mallowed Out`)) {
            if (!pullIfPossible(1, $item`giant pearl`, 24000)) {
                abort("Couldn't get giant pearl");
            }
        }

        useSkill($skill`Advanced Cocktailcrafting`); // get M and L
        eatPizza(
            $item`magical ice cubes`,
            $item`antique packet of ketchup`,
            $item`little paper umbrella`,
            $item`giant pearl`
        );
    }

    // craft potions after eating to ensure we have adventures
    if (!getPropertyBoolean('hasRange')) {
        ensureItem(1, $item`Dramatic™ range`);
        use(1, $item`Dramatic™ range`);
    }

    if (haveSkill($skill`Advanced Saucecrafting`)) useSkill(1, $skill`Advanced Saucecrafting`);
    ensurePotionEffect($effect`Tomato Power`, $item`tomato juice of powerful power`);
    ensurePotionEffect($effect`Mystically Oiled`, $item`ointment of the occult`);

    autosell(
        availableAmount($item`tomato juice of powerful power`),
        $item`tomato juice of powerful power`
    );
    autosell(availableAmount($item`ointment of the occult`), $item`ointment of the occult`);

    ensureEffect($effect`Favored by Lyle`);
    ensureEffect($effect`Starry-Eyed`);
    if (get('_powerfulGloveBatteryPowerUsed') <= 95) ensureEffect($effect`Triple-Sized`);
    ensureEffect($effect`Feeling Excited`);
    ensureEffect($effect`Uncucumbered`); // boxing daycare
    ensureSong($effect`The Magical Mojomuscular Melody`);
    ensureNpcEffect($effect`Glittering Eyelashes`, 5, $item`glittery mascara`);
    ensureEffect($effect`Hulkien`);
    ensureEffect($effect`Lapdog`);

    // Plan is for these buffs to fall all the way through to item -> hot res -> fam weight.
    ensureEffect($effect`Fidoxene`);
    ensureEffect($effect`Billiards Belligerence`);
    ensureEffect($effect`Do I Know You From Somewhere?`);
    ensureEffect($effect`You Learned Something Maybe!`);

    // if (!haveEffect($effect`Holiday Yoked`)) {
    //     adventureWithCarolGhost($effect`Holiday Yoked`);
    // }

    // eat the sausage gotten earlier to restore MP
    if (myMp() < 100) {
        ensureCreateItem(1, $item`magical sausage`);
        eat($item`magical sausage`);
    }

    if (haveSkill($skill`Love Mixology`)) {
        const lovePotion = $item`Love Potion #0`;
        const loveEffect = $effect`Tainted Love Potion`;
        if (haveEffect(loveEffect) === 0) {
            if (availableAmount(lovePotion) === 0) {
                useSkill(1, $skill`Love Mixology`);
            }
            visitUrl(`desc_effect.php?whicheffect=${loveEffect.descid}`);
            if (
                numericModifier(loveEffect, 'mysticality') > 10 &&
                numericModifier(loveEffect, 'muscle') > -30 &&
                numericModifier(loveEffect, 'moxie') > -30 &&
                numericModifier(loveEffect, 'maximum hp percent') > -0.001
            ) {
                use(1, lovePotion);
            }
        }
    }

    ensureEffect($effect`Blessing of your favorite Bird`); // Should be 75% myst for now.
    ensureSong($effect`Polka of Plenty`);
    // ensureEffect($effect`Song of Bravado`);
}

function doFreeFights() {
    cliExecute('fold makeshift garbage shirt');
    equip($item`makeshift garbage shirt`);
    equip($item`unwrapped knock-off retro superhero cape`);
    // equip($item`weeping willow wand`);
    equip($item`Fourth of May Cosplay Saber`);
    equip($item`familiar scrapbook`);
    equip($item`Cargo Cultist Shorts`);
    equip($slot`acc1`, $item`Beach Comb`);
    equip($slot`acc2`, $item`hewn moon-rune spoon`);
    equip($slot`acc3`, $item`backup camera`);

    useFamiliar($familiar`Hovering Sombrero`);
    // equip($slot`familiar`, $item`miniature crystal ball`);

    // Get buff things
    ensureSewerItem(1, $item`turtle totem`);
    ensureSewerItem(1, $item`saucepan`);

    upkeepHpAndMp();
    // cliExecute('mood cs');
    // cliExecute('mood execute');
    const mood = new Mood();
    mood.skill($skill`Astral Shell`);
    mood.skill($skill`Get Big`);
    mood.skill($skill`Blood Bond`);
    mood.skill($skill`Blood Bubble`);
    mood.skill($skill`Drescher's Annoying Noise`);
    mood.skill($skill`Elemental Saucesphere`);
    mood.skill($skill`Empathy of the Newt`);
    mood.skill($skill`Inscrutable Gaze`);
    mood.skill($skill`Leash of Linguini`);
    mood.skill($skill`Pride of the Puffin`);
    mood.skill($skill`Singer's Faithful Ocelot`);
    haveSkill($skill`Stevedave's Shanty of Superiority`) &&
        mood.skill($skill`Stevedave's Shanty of Superiority`);
    mood.skill($skill`Ur-Kel's Aria of Annoyance`);
    mood.skill($skill`Feel Excitement`);
    mood.execute();

    cliExecute('retrocape mysticality');

    // kill the mushroom and chew mushroom tea
    upkeepHpAndMp();
    if (!get('_mushroomGardenVisited')) {
        Macro.skill($skill`Barrage of Tears`)
            .skill($skill`Spittoon Monsoon`)
            .skill($skill`Saucestorm`)
            .repeat()
            .setAutoAttack();
        adv1($location`Your Mushroom Garden`);
        setAutoAttack(0);
        setChoice(1410, 2);
        adv1($location`Your Mushroom Garden`);
        use($item`free-range mushroom`);
    }

    if (!haveEffect($effect`Mush-Maw`)) {
        ensureCreateItem(1, $item`mushroom tea`);
        chew($item`mushroom tea`); // get Mush-Maw (+20 ML), 1 spleen
    }

    // Neverending Party
    set('choiceAdventure1322', '2'); // Here to Party
    set('choiceAdventure1324', '1'); // It Hasn't Ended, It's Just Paused; Head upstairs
    set('choiceAdventure1325', '2'); // A Room With a View... Of a Bed; Read the tomes

    equip($item`familiar scrapbook`);

    Macro.trySkill($skill`Feel Pride`)
        .skill($skill`Barrage of Tears`)
        .skill($skill`Spittoon Monsoon`)
        .skill($skill`Saucestorm`).setAutoAttack();

    while (get('_neverendingPartyFreeTurns') < 10) {
        upkeepHpAndMp();
        adv1($location`The Neverending Party`, -1, '');
    }

    // kill a Kramco to prep the back-up camera
    if (sausageFightGuaranteed()) {
        upkeepHpAndMp();
        equip($item`Kramco Sausage-o-Matic™`);
        Macro.if_('!monstername "sausage goblin"', new Macro().step('abort'))
            .skill($skill`Barrage of Tears`)
            .skill($skill`Spittoon Monsoon`)
            .skill($skill`Saucestorm`).setAutoAttack();
        adv1($location`Noob Cave`, -1, '');
        setAutoAttack(0);
    }

    // 10x back-up sausage fight @ The Dire Warren with Sombrero
    Macro.skill($skill`Back-Up to your Last Enemy`)
        .if_('!monstername "sausage goblin"', new Macro().step('abort'))
        .trySkill($skill`Feel Pride`)
        .skill($skill`Barrage of Tears`)
        .skill($skill`Spittoon Monsoon`)
        .skill($skill`Saucestorm`).setAutoAttack();

    while (get('_backUpUses') < 10) {
        upkeepHpAndMp();
        adv1($location`The Dire Warren`, -1, '');
    }

    // Professor chain off the last back-up
    equip($item`Fourth of May Cosplay Saber`);
    useFamiliar($familiar`Pocket Professor`);
    // equip($slot`familiar`, $item`Pocket Professor memory chip`);

    // if (myFamiliarWeight() < 75) abort('not maxing fam weight');

    Macro.trySkill($skill`Back-Up to your Last Enemy`)
        .skill($skill`Curse of Weaksauce`)
        .skill($skill`Entangling Noodles`)
        .trySkill(Skill.get('Lecture on Relativity'))
        .skill($skill`Spittoon Monsoon`)
        .skill($skill`Saucegeyser`)
        .setAutoAttack();
    adv1($location`The Dire Warren`);
    while (inMultiFight()) runCombat();
    equip($slot`familiar`, $item`none`);
    setAutoAttack(0);

    setAutoAttack(0);
    restoreHp(myMaxhp());

    cliExecute('mood apathetic');
}

function doHpTest() {
    ensurePotionEffect($effect`Expert Oiliness`, $item`oil of expertise`);
    cliExecute('retrocape muscle');

    // QUEST - Donate Blood (HP)
    if (myMaxhp() - myBuffedstat($stat`muscle`) - 3 < 1770) {
        useSkill(1, $skill`Chubby and Plump`);
        use($item`Chubby and Plump bar`);
    }

    doTest(Test.HP);
}

function doMoxTest() {
    if (myClass() === $class`Pastamancer`) useSkill(1, $skill`Bind Penne Dreadful`);
    else ensurePotionEffect($effect`Expert Oiliness`, $item`oil of expertise`);

    // Sauceror has 75% moxie bird
    use(1, $item`Bird-a-Day calendar`);
    ensureEffect($effect`Blessing of the Bird`);
    ensureEffect($effect`Big`);
    // ensureEffect($effect`Song of Bravado`);
    // ensureSong($effect`Stevedave's Shanty of Superiority`);
    ensureSong($effect`The Moxious Madrigal`);
    // ensureEffect($effect`Quiet Desperation`);
    // ensureEffect($effect`Disco Fever`);
    // ensureEffect($effect`Blubbered Up`);
    // ensureEffect($effect`Mariachi Mood`);
    cliExecute('retrocape moxie');

    maximize('moxie', false);

    if (myBuffedstat($stat`moxie`) - myBasestat($stat`moxie`) < 1770) {
        useSkill(1, $skill`Acquire Rhinestones`);
        use(availableAmount($item`rhinestone`), $item`rhinestone`);
    }
    doTest(Test.MOX);
}

function doMusTest() {
    if (myClass() === $class`Pastamancer`) useSkill(1, $skill`Bind Undead Elbow Macaroni`);
    else ensurePotionEffect($effect`Expert Oiliness`, $item`oil of expertise`);

    ensureEffect($effect`Big`);
    // ensureEffect($effect`Song of Bravado`);
    // ensureSong($effect`Stevedave's Shanty of Superiority`);
    // ensureSong($effect`Power Ballad of the Arrowsmith`);
    // ensureEffect($effect`Rage of the Reindeer`);
    // ensureEffect($effect`Quiet Determination`);
    // ensureEffect($effect`Disdain of the War Snapper`);
    cliExecute('retrocape muscle');

    haveFamiliar($familiar`Left-Hand Man`) && useFamiliar($familiar`Left-Hand Man`);
    maximize('muscle', false);

    // for (const increaser of [
    //   () => ensureEffect($effect`Ham-Fisted`),
    // ]) {
    //   if (myBuffedstat($stat`muscle`) - myBasestat($stat`mysticality`) < 1770) increaser();
    // }

    if (myBuffedstat($stat`muscle`) - myBasestat($stat`muscle`) < 1770) {
        throw 'Not enough muscle to cap.';
    }

    doTest(Test.MUS);
}

function doItemTest() {
    ensureItem(1, $item`oversized sparkler`);
    useFamiliar($familiar`Exotic Parrot`); // get that cracker

    // cyclops eyedrops
    if (!haveEffect($effect`One Very Clear Eye`)) {
        cliExecute('pillkeeper semirare');
        adv1($location`The Limerick Dungeon`);
        use($item`cyclops eyedrops`);
    }

    // Create CER pizza
    if (!haveEffect($effect`Certainty`)) {
        ensureSewerItem(1, $item`ravioli hat`);
        eatPizza( // TODO
            $item`coconut shell`, // cosmetic football
            $item`ear candle`,
            $item`ravioli hat`, // runproof mascara
            $item`blood-faced volleyball` // get that cracker
        );

        ensureItem(1, $item`cracker`);
        equip($slot`familiar`, $item`cracker`);
    }

    !get('_clanFortuneBuffUsed') && cliExecute('fortune buff item');
    !haveEffect($effect`Infernal Thirst`) && cliExecute('genie effect Infernal Thirst');
    !haveEffect($effect`Lantern-Charged`) && use($item`battery (lantern)`);
    ensureEffect($effect`Feeling Lost`);
    ensureEffect($effect`Singer's Faithful Ocelot`);
    ensureEffect($effect`Fat Leon's Phat Loot Lyric`);
    ensureEffect($effect`Steely-Eyed Squint`);
    ensureEffect($effect`Nearly All-Natural`); // bag of grain
    ensureEffect($effect`Blessing of the Bird`);

    equip($item`oversized sparkler`);
    equip($item`Kramco Sausage-o-Matic™`);

    maximize(
        'item, 2 booze drop, -equip broken champagne bottle, -equip surprisingly capacious handbag',
        false
    );

    doTest(Test.ITEM);
}

function doFamiliarTest() {
    if (myHp() < 30) useSkill(1, $skill`Cannelloni Cocoon`);
    ensureEffect($effect`Blood Bond`);
    ensureEffect($effect`Leash of Linguini`);
    ensureEffect($effect`Empathy`);

    // These should have fallen through all the way from leveling.
    ensureEffect($effect`Fidoxene`);
    ensureEffect($effect`Billiards Belligerence`);

    useFamiliar($familiar`Exotic Parrot`);
    equip($item`Fourth of May Cosplay Saber`);
    equip($item`familiar scrapbook`);
    equip($slot`acc2`, $item`hewn moon-rune spoon`);
    equip($slot`acc3`, $item`Beach Comb`);
    equip($slot`familiar`, $item`cracker`);
    // maximize('familiar weight', false);

    doTest(Test.FAMILIAR);
}

function doWeaponTest() {
    if (!haveEffect($effect`Cowrruption`)) {
        wishEffect($effect`Cowrruption`);
    }

    // OU pizza (pulverize sweatpants for useless powder)
    if (!haveEffect($effect`Outer Wolf™`)) {
        ensureItem(1, $item`tenderizing hammer`);
        availableAmount($item`useless powder`) === 0 && cliExecute('pulverize old sweatpants');
        eatPizza(
            $item`oil of expertise`,
            $item`useless powder`,
            $item`mushroom filet`,
            $item`mushroom filet`
        );
    }

    // if (haveEffect($effect`Do You Crush What I Crush?`) === 0) {
    //     adventureWithCarolGhost($effect`Do You Crush What I Crush?`);
    // }

    if (!haveEffect($effect`In a Lather`)) {
        useSkill($skill`The Ode to Booze`);
        cliExecute('drink Sockdollager');
    }

    if (availableAmount($item`twinkly nuggets`) > 0) {
        ensureEffect($effect`Twinkly Weapon`);
    }

    if (availableAmount($item`vial of hamethyst juice`) > 0) {
        ensureEffect($effect`Ham-Fisted`);
    }

    if (availableAmount($item`LOV Elixir #3`) > 0) ensureEffect($effect`The Power of LOV`);

    ensureEffect($effect`Carol of the Bulls`);
    // ensureEffect($effect`Song of the North`);
    // ensureEffect($effect`Rage of the Reindeer`);
    // ensureEffect($effect`Frenzied, Bloody`);
    // ensureEffect($effect`Scowl of the Auk`);
    // ensureEffect($effect`Disdain of the War Snapper`);
    // ensureEffect($effect`Tenacity of the Snapper`);
    // ensureSong($effect`Jackasses' Symphony of Destruction`);
    ensureEffect($effect`Billiards Belligerence`);
    // ensureNpcEffect($effect`Engorged Weapon`, 1, $item`Meleegra&trade; pills`); Gnome camp
    ensureEffect($effect`Lack of Body-Building`);
    haveSkill($skill`Bow-Legged Swagger`) && ensureEffect($effect`Bow-Legged Swagger`);

    if (availableAmount($item`Punching Potion`)) {
        ensurePotionEffect($effect`Feeling Punchy`, $item`Punching Potion`);
    }

    // cliExecute('boombox fists');
    if (!haveEffect($effect`Rictus of Yeg`)) {
        cliExecute('cargo pick 284');
        use($item`Yeg's Motel toothbrush`);
    }

    // Tea party
    if (!getPropertyBoolean('_madTeaParty')) {
        ensureItem(1, $item`goofily-plumed helmet`);
        ensureEffect($effect`Weapon of Mass Destruction`);
    }

    eat(1, $item`glass of raw eggs`);

    maximize('weapon damage, weapon damage percent', false);

    doTest(Test.WEAPON);
}

function doSpellTest() {
    // ensureEffect($effect`Simmering`);

    // ensureEffect($effect`Song of Sauce`);
    ensureEffect($effect`AAA-Charged`);
    ensureEffect($effect`Carol of the Hells`);
    // ensureEffect($effect`Arched Eyebrow of the Archmage`);
    // ensureSong($effect`Jackasses' Symphony of Destruction`);

    // Pool buff
    if (get('_poolGames') < 3) {
        ensureEffect($effect`Mental A-cue-ity`);
    }

    // Tea party
    if (!getPropertyBoolean('_madTeaParty')) {
        ensureSewerItem(1, $item`mariachi hat`);
        ensureEffect($effect`Full Bottle in front of Me`);
    }

    // if (haveEffect($effect`Do You Crush What I Crush?`) === 0) {
    //     adventureWithCarolGhost($effect`Do You Crush What I Crush?`);
    // }

    useSkill(1, $skill`Spirit of Cayenne`);

    if (availableAmount($item`LOV Elixir #6`) > 0) ensureEffect($effect`The Magic of LOV`);

    ensureEffect($effect`Elemental Saucesphere`);
    ensureEffect($effect`Astral Shell`);
    ensureEffect($effect`We're All Made of Starfish`);
    if (haveEffect($effect`Feeling Peaceful`) === 0) useSkill($skill`Feel Peaceful`);

    // Deep Dark Visions
    useFamiliar($familiar`Exotic Parrot`);

    cliExecute('retrocape vampire hold');

    // Mafia sometimes can't figure out that multiple +weight things would get us to next tier.
    maximize('hot res, 0.01 familiar weight', false);
    // if (haveEffect($effect`Visions of the Deep Dark Deeps`) < 50) {
    //     if (myMp() < 20) {
    //         ensureCreateItem(1, $item`magical sausage`);
    //         eat(1, $item`magical sausage`);
    //     }
    //     while (myHp() < myMaxhp()) {
    //         useSkill(1, $skill`Cannelloni Cocoon`);
    //     }
    //     if (myMp() < 100) {
    //         ensureCreateItem(1, $item`magical sausage`);
    //         eat(1, $item`magical sausage`);
    //     }
    //     if (Math.round(numericModifier('spooky resistance')) < 10) {
    //         ensureEffect($effect`Does It Have a Skull In There??`);
    //         if (Math.round(numericModifier('spooky resistance')) < 10) {
    //             throw 'Not enough spooky res for Deep Dark Visions.';
    //         }
    //     }
    //     useSkill(1, $skill`Deep Dark Visions`);
    // }

    equip($item`weeping willow wand`);
    equip($slot`acc1`, $item`Powerful Glove`);
    equip($slot`acc2`, $item`hewn moon-rune spoon`);
    availableAmount($item`psychic's amulet`) > 0 && equip($slot`acc3`, $item`psychic's amulet`);
    // maximize('spell damage', false);

    if (Math.round(numericModifier('spell damage percent')) % 50 >= 40) {
        ensureItem(1, $item`soda water`);
        ensurePotionEffect($effect`Concentration`, $item`cordial of concentration`);
    }

    doTest(Test.SPELL);
}

function doHotResTest() {
    // fax and lick factory worker
    if (availableAmount($item`photocopied monster`) === 0 && !get('_photocopyUsed')) {
        chatPrivate('cheesefax', 'factory worker');
        for (let i = 0; i < 2; i++) {
            wait(10);
            cliExecute('fax receive');
            if (getProperty('photocopyMonster') === 'factory worker') break;
            // otherwise got the wrong monster, put it back.
            cliExecute('fax send');
        }
        if (availableAmount($item`photocopied monster`) === 0) throw 'Failed to fax in factory worker.';

        cliExecute('mood apathetic');
        Macro.skill($skill`Shocking Lick`).setAutoAttack();
        use(1, $item`photocopied monster`);
        setAutoAttack(0);
    }

    // Make sure no moon spoon.
    equip($slot`acc1`, $item`Eight Days a Week Pill Keeper`);
    equip($slot`acc2`, $item`Powerful Glove`);
    equip($slot`acc3`, $item`Lil' Doctor™ bag`);

    ensureItem(1, $item`tenderizing hammer`);
    cliExecute('smash * ratty knitted cap');
    cliExecute('smash * red-hot sausage fork');
    autosell(10, $item`hot nuggets`);
    autosell(10, $item`twinkly powder`);

    // adventureWithCarolGhost($effect`Let It Snow/Boil/Stink/Frighten/Grease`);

    if (availableAmount($item`hot powder`) > 0) {
        ensureEffect($effect`Flame-Retardant Trousers`);
    }

    if (
        availableAmount($item`sleaze powder`) > 0 ||
        availableAmount($item`lotion of sleaziness`) > 0
    ) {
        ensurePotionEffect($effect`Sleazy Hands`, $item`lotion of sleaziness`);
    }

    ensureEffect($effect`Rainbowolin`);
    ensureEffect($effect`Elemental Saucesphere`);
    ensureEffect($effect`Astral Shell`);
    ensureEffect($effect`Blood Bond`);
    ensureEffect($effect`Leash of Linguini`);
    ensureEffect($effect`Empathy`);
    ensureEffect($effect`Feeling Peaceful`);
    ensureEffect($effect`Hot-Headed`);
    ensurePotionEffect($effect`Amazing`, $item`pocket maze`);
    ensurePullEffect($effect`Fireproof Lips`, $item`SPF 451 lip balm`);

    if (!haveEffect($effect`Feeling No Pain`)) {
        useSkill($skill`The Ode to Booze`);
        cliExecute('drink Ish Kabibble');
    }

    useFamiliar($familiar`Exotic Parrot`);

    cliExecute('retrocape vampire hold');
    equip($item`Fourth of May Cosplay Saber`);
    equip($item`unwrapped knock-off retro superhero cape`);
    equip($item`lava-proof pants`);
    equip($slot`acc3`, $item`heat-resistant gloves`);
    availableAmount($item`psychic's amulet`) > 0 && equip($item`psychic's amulet`);
    equip($slot`familiar`, $item`cracker`);

    // Mafia sometimes can't figure out that multiple +weight things would get us to next tier.
    // maximize('hot res, 0.01 familiar weight', false);

    doTest(Test.HOT_RES);
}

function doNonCombatTest() {
    useFamiliar($familiar`Disgeist`);

    if (myHp() < 30) useSkill(1, $skill`Cannelloni Cocoon`);
    ensureEffect($effect`Blood Bond`);
    ensureEffect($effect`Leash of Linguini`);
    ensureEffect($effect`Empathy`);

    ensureEffect($effect`The Sonata of Sneakiness`);
    ensureEffect($effect`Smooth Movements`);
    if (get('_powerfulGloveBatteryPowerUsed') <= 95) ensureEffect($effect`Invisible Avatar`);
    ensureEffect($effect`Feeling Lonely`);
    ensureEffect($effect`A Rose by Any Other Material`);
    ensureEffect($effect`Throwing Some Shade`);

    wishEffect($effect`Disquiet Riot`);

    // cliExecute('acquire porkpie-mounted popper');
    // equip($item`porkpie-mounted popper`);
    equip($item`fish hatchet`);
    equip($slot`acc2`, $item`hewn moon-rune spoon`);

    doTest(Test.NONCOMBAT);
}

export function main(): void {
    setAutoAttack(0);

    if (myTurncount() < 60) {
        setup();
        getPizzaIngredients();
        doTest(Test.COIL_WIRE);
    }

    if (myTurncount() < 60) throw 'Something went wrong coiling wire.';

    if (myLevel() < 8) {
        useStatGains();
        buffBeforeGoblins();
    }

    if (myLevel() < 13) {
        doFreeFights();
    }

    if (!testDone(Test.MYS)) doTest(Test.MYS);
    if (!testDone(Test.HP)) doHpTest();
    if (!testDone(Test.MUS)) doMusTest();
    if (!testDone(Test.MOX)) doMoxTest();

    if (
        availableAmount($item`astral six-pack`) === 1 ||
        availableAmount($item`astral pilsner`) >= 5
    ) {
        tryUse(1, $item`astral six-pack`);
        useSkill(2, $skill`The Ode to Booze`);
        drink(6, $item`astral pilsner`);
    }

    if (!testDone(Test.ITEM)) doItemTest();
    if (!testDone(Test.FAMILIAR)) doFamiliarTest();
    if (!testDone(Test.HOT_RES)) doHotResTest();
    if (!testDone(Test.WEAPON)) doWeaponTest();
    if (!testDone(Test.SPELL)) doSpellTest();
    if (!testDone(Test.NONCOMBAT)) doNonCombatTest();

    const totalSeconds = (gametimeToInt() - getPropertyInt('bb_ScriptStartCS')) / 1000;
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;

    print(`Total seconds for sanity check: ${totalSeconds}`);
    print(`That only took ${min}:${sec.toFixed(2)} and ${myTurncount()} turns!`, 'green');
    print(`Organ use: ${myFullness()}/${myInebriety()}/${mySpleenUse()}`, 'green');
    for (let i = 1; i <= 10; i++) {
        print(
            `Test ${Test[i]} estimated turns: ${get(`_hccsTestExpected${i}`)} actual turns:${get(`_hccsTestActual${i}`)} gated hardcoded value: ${desiredTurns[i]}`,
            'blue'
        );
    }

    if (!testDone(Test.DONATE)) {
        doTest(Test.DONATE);
    }

    // setProperty('autoSatisfyWithNPCs', getProperty('_saved_autoSatisfyWithNPCs'));
    // setProperty('autoSatisfyWithCoinmasters', getProperty('_saved_autoSatisfyWithCoinmasters'));
    // setProperty('hpAutoRecovery', '0.8');
    //
    // cliExecute('mood default');
    // cliExecute('ccs default');
    // // cliExecute('boombox food');
    // cliExecute('refresh all');
    //
    // // Tune moon sign to Wombat (for meat farming).
    // if (!get('moonTuned')) {
    //     // Unequip spoon.
    //     equip($slot`acc1`, $item`Retrospecs`);
    //     equip($slot`acc2`, $item`Powerful Glove`);
    //     equip($slot`acc3`, $item`Lil' Doctor™ bag`);
    //
    //     // Actually tune the moon.
    //     visitUrl('inv_use.php?whichitem=10254&doit=96&whichsign=7');
    // }
    //
    // putShop(180000, 0, 1, $item`blood-drive sticker`);
    // putShop(99000, 0, 1, $item`emergency margarita`);
    // putShop(94000, 0, 1, $item`vintage smart drink`);
    //
    // cliExecute('hagnk all');
    // cliExecute('acquire bitchin meatcar');
    // cliExecute('use clockwork maid');
    // buy($item`pocket wish`, 1, 50000);
    // visitUrl('peevpee.php?action=smashstone&confirm=on');
    // maximize('hp', false);
    // eat($item`magical sausage`);
    // useSkill($skill`Cannelloni Cocoon`);
    // cliExecute('bb_login');
}
