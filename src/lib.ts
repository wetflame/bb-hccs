import {
    abort,
    adv1,
    availableAmount,
    buy,
    buyUsingStorage,
    cliExecute,
    create,
    eat,
    equip,
    equippedItem,
    familiarWeight,
    getClanName,
    getProperty,
    handlingChoice,
    haveEffect,
    haveSkill,
    myFamiliar,
    myMaxmp,
    myMp,
    print,
    pullsRemaining,
    retrieveItem,
    runChoice,
    runCombat,
    setAutoAttack,
    setProperty,
    shopAmount,
    storageAmount,
    takeShop,
    toEffect,
    toInt,
    toString as toStringAsh,
    totalTurnsPlayed,
    toUrl,
    use,
    useFamiliar,
    useSkill,
    visitUrl,
    weightAdjustment,
} from 'kolmafia';
import {
    $effect,
    $effects,
    $familiar,
    $item,
    $location,
    $skill,
    $slot,
    get,
    Macro,
    set,
} from 'libram';

export function getPropertyInt(name: string): number {
    const str = getProperty(name);
    if (str === '') {
        throw `Unknown property ${name}.`;
    }
    return toInt(str);
}

export function incrementProperty(name: string): void {
    set(name, getPropertyInt(name) + 1);
}

export function setChoice(adv: number, choice: number): void {
    setProperty(`choiceAdventure${adv}`, `${choice}`);
}

export function myFamiliarWeight(): number {
    return familiarWeight(myFamiliar()) + weightAdjustment();
}

export function ensureItem(quantity: number, it: Item): void {
    if (availableAmount(it) < quantity) {
        buy(quantity - availableAmount(it), it);
    }
    if (availableAmount(it) < quantity) {
        throw `Could not buy ${quantity} of item ${it.name}: only ${availableAmount(it)}.`;
    }
}

export function ensureCreateItem(quantity: number, it: Item): void {
    if (availableAmount(it) < quantity) {
        create(quantity - availableAmount(it), it);
    }
    if (availableAmount(it) < quantity) {
        throw 'Could not create item.';
    }
}

export function ensureSewerItem(quantity: number, it: Item): void {
    while (availableAmount(it) < quantity) {
        ensureItem(1, $item`chewing gum on a string`);
        use(1, $item`chewing gum on a string`);
    }
}

export function ensureHermitItem(quantity: number, it: Item): void {
    if (availableAmount(it) >= quantity) {
        return;
    }
    const count = quantity - availableAmount(it);
    while (
        availableAmount($item`worthless trinket`) +
        availableAmount($item`worthless gewgaw`) +
        availableAmount($item`worthless knick-knack`) <
        count
    ) {
        ensureItem(1, $item`chewing gum on a string`);
        use(1, $item`chewing gum on a string`);
    }
    ensureItem(1, $item`hermit permit`);
    retrieveItem(count, it);
}

export function ensureNpcEffect(ef: Effect, quantity: number, potion: Item): void {
    if (haveEffect(ef) === 0) {
        ensureItem(quantity, potion);
        if (!cliExecute(ef.default) || haveEffect(ef) === 0) {
            throw `Failed to get effect ${ef.name}`;
        }
    } else {
        print(`Already have effect ${ef.name}.`);
    }
}

export function ensurePotionEffect(ef: Effect, potion: Item): void {
    if (haveEffect(ef) === 0) {
        if (availableAmount(potion) === 0) {
            create(1, potion);
        }
        if (!cliExecute(ef.default) || haveEffect(ef) === 0) {
            throw `Failed to get effect ${ef.name}.`;
        }
    } else {
        print(`Already have effect ${ef.name}.`);
    }
}

export function ensureEffect(ef: Effect, turns = 1): void {
    if (haveEffect(ef) < turns) {
        if (!cliExecute(ef.default) || haveEffect(ef) === 0) {
            throw `Failed to get effect ${ef.name}.`;
        }
    } else {
        print(`Already have effect ${ef.name}.`);
    }
}

export function ensureMpTonic(mp: number): void {
    while (myMp() < mp) {
        ensureItem(1, $item`Doc Galaktik's Invigorating Tonic`);
        use(1, $item`Doc Galaktik's Invigorating Tonic`);
    }
}

export function ensureMpSausage(mp: number): void {
    while (myMp() < Math.min(mp, myMaxmp())) {
        ensureCreateItem(1, $item`magical sausage`);
        eat(1, $item`magical sausage`);
    }
}

export function sausageFightGuaranteed(): boolean {
    const goblinsFought = getPropertyInt('_sausageFights');
    const nextGuaranteed =
        getPropertyInt('_lastSausageMonsterTurn') +
        4 +
        goblinsFought * 3 +
        Math.max(0, goblinsFought - 5) ** 3;
    return goblinsFought === 0 || totalTurnsPlayed() >= nextGuaranteed;
}

export function itemPriority(...items: Item[]): Item {
    return items.find((item: Item) => availableAmount(item) > 0) ?? items[items.length - 1];
}

export function setClan(target: string): boolean {
    if (getClanName() !== target) {
        const clanCache = JSON.parse(getProperty('hccs_clanCache') || '{}');
        if (clanCache.target === undefined) {
            const recruiter = visitUrl('clan_signup.php');
            const clanRe = /<option value=([0-9]+)>([^<]+)<\/option>/g;
            let match;
            while ((match = clanRe.exec(recruiter)) !== null) {
                clanCache[match[2]] = match[1];
            }
        }
        setProperty('hccs_clanCache', JSON.stringify(clanCache));

        visitUrl(`showclan.php?whichclan=${clanCache[target]}&action=joinclan&confirm=on&pwd`);
        if (getClanName() !== target) {
            throw `failed to switch clans to ${target}. Did you spell it correctly? Are you whitelisted?`;
        }
    }
    return true;
}

export function eatPizza(...ingredients: Item[]): void {
    const ingrs = ingredients.map((ingr) => toInt(ingr)).join();
    visitUrl(`campground.php?action=makepizza&pizza=${ingrs}`);
    ensureItem(1, $item`diabolic pizza`);
    eat($item`diabolic pizza`);
    cliExecute('refresh inventory');
}

export function mapMonster(location: Location, monster: Monster): void {
    if (
        haveSkill($skill`Map the Monsters`) &&
        !get('mappingMonsters') &&
        get('_monstersMapped') < 3
    ) {
        useSkill($skill`Map the Monsters`);
    }

    if (!get('mappingMonsters')) throw 'Failed to setup Map the Monsters.';

    const mapPage = visitUrl(toUrl(location), false, true);
    if (!mapPage.includes('Leading Yourself Right to Them')) throw 'Something went wrong mapping.';

    const fightPage = visitUrl(
        `choice.php?pwd&whichchoice=1435&option=1&heyscriptswhatsupwinkwink=${monster.id}`
    );
    if (!fightPage.includes(monster.name)) throw 'Something went wrong starting the fight.';
}

export function mapAndSaberMonster(location: Location, monster: Monster): void {
    mapMonster(location, monster);

    withMacro(Macro.skill($skill`Use the Force`), runCombat);
    if (handlingChoice()) runChoice(3);
}

export function tryUse(quantity: number, it: Item): boolean {
    if (availableAmount(it) > 0) {
        return use(quantity, it);
    } else {
        return false;
    }
}

export function tryEquip(it: Item): boolean {
    if (availableAmount(it) > 0) {
        return equip(it);
    } else {
        return false;
    }
}

export function wishEffect(ef: Effect): void {
    if (haveEffect(ef) === 0) {
        cliExecute(`genie effect ${ef.name}`);
    } else {
        print(`Already have effect ${ef.name}.`);
    }
}

export function pullIfPossible(quantity: number, it: Item, maxPrice: number): boolean {
    if (pullsRemaining() > 0) {
        const quantityPull = Math.max(0, quantity - availableAmount(it));
        if (shopAmount(it) > 0) {
            takeShop(Math.min(shopAmount(it), quantityPull), it);
        }
        if (storageAmount(it) < quantityPull) {
            buyUsingStorage(quantityPull - storageAmount(it), it, maxPrice);
        }
        cliExecute(`pull ${quantityPull} ${it.name}`);
        return true;
    } else return false;
}

export function ensurePullEffect(ef: Effect, it: Item): void {
    if (haveEffect(ef) === 0) {
        if (availableAmount(it) > 0 || pullIfPossible(1, it, 50000)) ensureEffect(ef);
    }
}

export function shrug(ef: Effect): void {
    if (haveEffect(ef) > 0) {
        cliExecute(`shrug ${ef.name}`);
    }
}

// We have Stevedave's, Ur-Kel's on at all times during leveling (managed via mood); third and fourth slots are variable.
const songSlots = [
    $effects`Stevedave's Shanty of Superiority`,
    $effects`Ur-Kel's Aria of Annoyance`,
    $effects`Power Ballad of the Arrowsmith, The Magical Mojomuscular Melody, The Moxious Madrigal, Ode to Booze, Jackasses' Symphony of Destruction`,
    $effects`Carlweather's Cantata of Confrontation, The Sonata of Sneakiness, Fat Leon's Phat Loot Lyric, Polka of Plenty`,
];
const allKnownSongs = ([] as Effect[]).concat(...songSlots);
const allSongs = Skill.all()
    .filter(
        (skill) => toStringAsh((skill.class as unknown) as string) === 'Accordion Thief' && skill.buff
    )
    .map((skill) => toEffect(skill));
export function openSongSlot(song: Effect): void {
    for (const songSlot of songSlots) {
        if (songSlot.includes(song)) {
            for (const shruggable of songSlot) {
                shrug(shruggable);
            }
        }
    }
    for (const badSong of allSongs) {
        if (!allKnownSongs.includes(badSong)) {
            shrug(badSong);
        }
    }
}

export function ensureSong(ef: Effect): void {
    if (haveEffect(ef) === 0) {
        openSongSlot(ef);
        if (!cliExecute(ef.default) || haveEffect(ef) === 0) {
            throw `Failed to get effect ${ef.name}`;
        }
    } else {
        print(`Already have effect ${ef.name}.`);
    }
}

export function ensureOde(turns: number): void {
    while (haveEffect($effect`Ode to Booze`) < turns) {
        ensureMpTonic(50);
        openSongSlot($effect`Ode to Booze`);
        useSkill(1, $skill`The Ode to Booze`);
    }
}

export function withMacro<T>(macro: Macro, action: () => T): T {
    macro.save();
    try {
        return action();
    } finally {
        Macro.clearSaved();
    }
}

export function adventureWithCarolGhost(effect: Effect, macro?: Macro): void {
    if (haveEffect($effect`Feeling Lost`)) abort('Attempting to Carol Ghost while feeling lost');

    if (
        haveEffect($effect`Holiday Yoked`) ||
        haveEffect($effect`Do You Crush What I Crush?`) ||
        haveEffect($effect`Let It Snow/Boil/Stink/Frighten/Grease`)
    ) {
        abort('Attempting to Carol Ghost with previous effect active.');
    }

    const offHand = equippedItem($slot`off-hand`);
    let location = $location`Noob Cave`;
    equip($item`familiar scrapbook`); // ensure no kramco

    switch (effect) {
        case $effect`Holiday Yoked`:
            break;
        case $effect`Do You Crush What I Crush?`:
            if (sausageFightGuaranteed()) {
                equip($item`Kramco Sausage-o-Matic™`);
            } else {
                location = $location`The Outskirts of Cobb's Knob`;
            }
            break;
        case $effect`Let It Snow/Boil/Stink/Frighten/Grease`:
            location = $location`The Haunted Kitchen`;
            break;
    }

    if (get('_reflexHammerUsed') >= 3 && get('_chestXRayUsed') >= 3) {
        throw 'No free-kill for Carol Ghost!';
    }

    useFamiliar($familiar`Ghost of Crimbo Carols`);
    equip($slot`acc3`, $item`Lil' Doctor™ bag`);

    if (macro) {
        macro.setAutoAttack();
    } else {
        Macro.trySkill($skill`Reflex Hammer`).skill($skill`Chest X-Ray`).setAutoAttack();
    }

    adv1(location);
    setAutoAttack(0);

    equip(offHand);

    // hit an NC or something, try again
    if (!haveEffect(effect)) {
        adventureWithCarolGhost(effect);
    }
}
