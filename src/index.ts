import { canAdv } from 'canadv.ash';
import {
  useFamiliar,
  equip,
  availableAmount,
  use,
  autosell,
  haveEffect,
  cliExecute,
  print,
  visitUrl,
  eat,
  useSkill,
  numericModifier,
  myBasestat,
  myBuffedstat,
  containsText,
  setProperty,
  getProperty,
  myLevel,
  runChoice,
  myTurncount,
  myHp,
  myMaxhp,
  myGardenType,
  myClass,
  adv1,
  runCombat,
  handlingChoice,
  haveSkill,
  maximize,
  drink,
  myMp,
  myAdventures,
  wait,
  chatPrivate,
  haveFamiliar,
  userConfirm,
  abort,
  toInt,
  restoreHp,
  setAutoAttack,
  gametimeToInt,
  chew,
  inMultiFight,
} from 'kolmafia';
import {
  $familiar,
  $item,
  $effect,
  $effects,
  $skill,
  $slot,
  $location,
  $stat,
  $monster,
  $class,
  get,
  TunnelOfLove,
  Witchess,
  Mood,
  Macro,
  adventureMacro,
  adventureMacroAuto,
} from 'libram';
import {
  ensureEffect,
  ensureItem,
  getPropertyInt,
  sausageFightGuaranteed,
  setChoice,
  setClan,
  ensureCreateItem,
  getPropertyBoolean,
  ensureNpcEffect,
  ensureSewerItem,
  ensurePotionEffect,
  myFamiliarWeight,
  ensurePullEffect,
  pullIfPossible,
  tryUse,
  wishEffect,
  ensureSong,
  adventureWithCarolGhost,
  mapAndSaberMonster,
  mapMonster,
  withMacro,
} from './lib';
import { SynthesisPlanner } from './synthesis';

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

const defaultFamiliar = $familiar`Melodramedary`;
const defaultFamiliarEquipment = $item`dromedary drinking helmet`;

const itemTurns = () =>
  60 -
  Math.floor(numericModifier('item drop') / 30) -
  Math.floor(numericModifier('booze drop') / 15);

function upkeepHpAndMp() {
  if (myHp() < 0.8 * myMaxhp()) {
    visitUrl('clan_viplounge.php?where=hottub');
  }
  if (myMp() < 500) {
    eat($item`magical sausage`);
  }
}

function haveBeachComb() {
  return availableAmount($item`Beach Comb`) > 0;
}

function useDefaultFamiliar() {
  useFamiliar(defaultFamiliar);
  if (defaultFamiliarEquipment !== $item`none` && availableAmount(defaultFamiliarEquipment) > 0) {
    equip(defaultFamiliarEquipment);
  }
}

function defaultOutfit() {
  equip($slot`shirt`, $item`fresh coat of paint`);
  equip($item`weeping willow wand`);
  equip($item`familiar scrapbook`);
  equip($item`Cargo Cultist Shorts`);
  equip($slot`acc1`, $item`Brutal brogues`);
  equip($slot`acc2`, $item`hewn moon-rune spoon`);
  equip($slot`acc3`, $item`backup camera`);
}

function testDone(testNum: number) {
  print(`Checking test ${testNum}...`);
  const text = visitUrl('council.php');
  return !containsText(text, `<input type=hidden name=option value=${testNum}>`);
}

function doTest(testNum: number) {
  if (!testDone(testNum)) {
    visitUrl(`choice.php?whichchoice=1089&option=${testNum}`);
    if (!testDone(testNum)) {
      throw 'Failed to do test " + testNum + ". Maybe we are out of turns.';
    }
  } else {
    print(`Test ${testNum} already completed.`);
  }
}

// Sweet Synthesis plan.
// This is the sequence of synthesis effects; we will, if possible, come up with a plan for allocating candy to each of these.
const synthesisPlanner = new SynthesisPlanner(
  $effects`Synthesis: Learning, Synthesis: Smart, Synthesis: Collection`
);

function setup() {
  // Don't buy stuff from NPC stores.
  setProperty('_saved_autoSatisfyWithNPCs', getProperty('autoSatisfyWithNPCs'));
  setProperty('autoSatisfyWithNPCs', 'true');

  // Do buy stuff from coinmasters (hermit).
  setProperty('_saved_autoSatisfyWithCoinmasters', getProperty('autoSatisfyWithCoinmasters'));
  setProperty('autoSatisfyWithCoinmasters', 'true');

  // Initialize council.
  visitUrl('council.php');

  cliExecute('mood apathetic');

  // All combat handled by our consult script (hccs_combat.ash).
  cliExecute('ccs bean-hccs');

  // Turn off Lil' Doctor quests.
  setChoice(1340, 3);

  // setup backup camera (reverser and ML)
  cliExecute('backupcamera reverser on');
  cliExecute('backupcamera ml');

  // Upgrade saber for fam wt
  visitUrl('main.php?action=may4');
  runChoice(4);

  // Visiting Looking Glass in clan VIP lounge
  visitUrl('clan_viplounge.php?action=lookingglass&whichfloor=2');
  while (getPropertyInt('_genieWishesUsed') < 3) {
    cliExecute('genie wish for more wishes');
  }

  // pull and use borrowed time
  if (availableAmount($item`borrowed time`) === 0 && !get('_borrowedTimeUsed')) {
    if (pullIfPossible(1, $item`borrowed time`, 20000)) {
      use($item`borrowed time`);
    } else {
      abort("Couldn't get borrowed time");
    }
  }

  // pull giant pearl for MALG pizza
  if (availableAmount($item`giant pearl`) === 0 && !haveEffect($effect`Mallowed Out`)) {
    if (!pullIfPossible(1, $item`giant pearl`, 24000)) {
      abort("Couldn't get giant pearl");
    }
  }

  // get clan consults
  // setClan('Bonus Adventures from Hell');
  // if (getPropertyInt('_clanFortuneConsultUses') < 3) {
  //   while (getPropertyInt('_clanFortuneConsultUses') < 3) {
  //     cliExecute('fortune cheesefax');
  //     cliExecute('wait 5');
  //   }
  // }

  cliExecute('boombox meat');
  cliExecute('mcd 11');
  // cliExecute('acquire bitchin');

  // Sell pork gems + tent
  visitUrl('tutorial.php?action=toot');
  tryUse(1, $item`letter from King Ralph XI`);
  tryUse(1, $item`pork elf goodies sack`);
  autosell(5, $item`baconstone`);
  autosell(5, $item`porquoise`);
  autosell(5, $item`hamethyst`);

  ensureItem(1, $item`toy accordion`);

  // lathe wand
  visitUrl('shop.php?whichshop=lathe&action=buyitem&quantity=1&whichrow=1162&pwd');

  if (!get('_floundryItemCreated')) {
    cliExecute('acquire fish hatchet');
  }

  // Put on some regen gear
  equip($item`Fourth of May Cosplay Saber`);
  equip($item`familiar scrapbook`); // maxmize scrap drops during saber YRs
  equip($item`Cargo Cultist Shorts`);
  equip($slot`acc1`, $item`Eight Days a Week Pill Keeper`);
  equip($slot`acc2`, $item`Powerful Glove`);
  equip($slot`acc3`, $item`Lil' Doctor™ bag`);

  useFamiliar($familiar`Plastic Pirate Skull`); // maxmize scrap drops during saber YRs and kramco

  setProperty('choiceAdventure1387', '3'); // set saber to drop items

  // // Envy + Freekill for Eggbeater (CER* and CATE pizzas)
  // mapMonster($location`The Haunted Kitchen`, $monster`possessed silverware drawer`);
  // withMacro(Macro.skill($skill`Feel Envy`).skill($skill`Chest X-Ray`), runCombat);
  //
  // // Nost + Envy + Freekill for Eggbeater and Asparagus knife (CER, CATE, MAL pizzas)
  // mapMonster($location`The Haunted Pantry`, $monster`fiendish can of asparagus`);
  // withMacro(Macro.skill($skill`Feel Nostalgic`).skill($skill`Feel Envy`).skill($skill`Chest X-Ray`), runCombat);
  //
  // // Nost + Envy + Freekill for Asparagus knife (pizza) and tomato (reagent potion)
  // mapMonster($location`The Haunted Pantry`, $monster`possessed can of tomatoes`);
  // withMacro(Macro.skill($skill`Feel Nostalgic`).skill($skill`Feel Envy`).skill($skill`Chest X-Ray`), runCombat);

  // Eggbeater in pantry (Saber YR) for CER* pizza
  mapAndSaberMonster($location`The Haunted Kitchen`, $monster`possessed silverware drawer`);

  // Tomato in pantry (Saber YR)
  mapAndSaberMonster($location`The Haunted Pantry`, $monster`possessed can of tomatoes`);

  // Asparagus knife in pantry (Saber YR) for MAL* pizza
  mapAndSaberMonster($location`The Haunted Pantry`, $monster`fiendish can of asparagus`);

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
  equip($slot`acc1`, $item`Powerful Glove`);
  adventureMacroAuto(
    $location`The Skeleton Store`,
    Macro.step('mark start')
      .if_('monstername novelty tropical skeleton', Macro.trySkill('use the force'))
      .trySkill('CHEAT CODE: Replace Enemy')
      .step('goto start')
  );
  if (handlingChoice()) runChoice(3);

  // // kill irate mariachi in South of the Border for irate sombrero (DIF pizza)
  // mapAndSaberMonster($location`South of The Border`, $monster`Irate mariachi`);
  //
  // // kill zombie chef in The Haunted Kitchen for fricasseed brains (DIF pizza)
  // mapAndSaberMonster($location`The Haunted Kitchen`, $monster`zombie chef`);

  // kill a kramco for the sausage before coiling wire
  if (sausageFightGuaranteed()) {
    equip($item`Kramco Sausage-o-Matic™`);
    adventureMacroAuto(
      $location`Noob Cave`,
      Macro.if_('!monstername "sausage goblin"', new Macro().step('abort')).skill(
        $skill`saucestorm`
      )
    );
  }
}

function useStatGains() {
  if (get('getawayCampsiteUnlocked') && haveEffect($effect`That's Just Cloud-Talk, Man`) === 0) {
    visitUrl('place.php?whichplace=campaway&action=campaway_sky');
  }

  if (availableAmount($item`Bastille Battalion control rig`) === 0) {
    if (!pullIfPossible(1, $item`Bastille Battalion control rig loaner voucher`, 20000)) {
      abort('Could not get bastille voucher');
    }
  }

  ensureEffect($effect`Inscrutable Gaze`);
  ensureEffect($effect`Thaumodynamic`);
  ensurePullEffect($effect`Different Way of Seeing Things`, $item`non-Euclidean angle`);
  ensurePullEffect($effect`Category`, $item`abstraction: category`);

  equip($item`familiar scrapbook`); // make use of exp boosts

  // Prep Sweet Synthesis.
  if (haveSkill($skill`Sweet Synthesis`)) {
    if (myGardenType() === 'peppermint') {
      cliExecute('garden pick');
    } else {
      print(
        'WARNING: This script is built for peppermint garden. Switch gardens or find other candy.',
        'red'
      );
    }

    if (getPropertyInt('_candySummons') === 0) {
      useSkill(1, $skill`Summon Crimbo Candy`);
    }

    useSkill(1, $skill`Chubby and Plump`);

    synthesisPlanner.synthesize($effect`Synthesis: Learning`);
    synthesisPlanner.synthesize($effect`Synthesis: Smart`);
  }

  if (Math.round(numericModifier('mysticality experience percent')) < 100) {
    throw 'Insufficient +stat%.';
  }

  // Use ten-percent bonus
  tryUse(1, $item`a ten-percent bonus`);
  cliExecute('bastille myst brutalist'); // Depends on Ez's Bastille script.

  // Scavenge for gym equipment
  if (toInt(get('_daycareGymScavenges')) < 1) {
    visitUrl('/place.php?whichplace=town_wrong&action=townwrong_boxingdaycare');
    const pg = runChoice(3);
    if (containsText(pg, '[free]')) runChoice(2);
    runChoice(5);
    runChoice(4);
  }
}

/**
 * Buffs that don't require MP and will boost stat gains from sausage goblins.
 * Can't bost MP because we haven't eaten the magical sausage yet.
 */
function buffBeforeGoblins() {
  // MAL pizza
  if (!haveEffect($effect`Mallowed Out`)) {
    useSkill($skill`Advanced Cocktailcrafting`); // get M and L for the MAL pizza
    visitUrl(
      `campground.php?action=makepizza&pizza=
      ${toInt($item`magical ice cubes`)},
      ${toInt($item`asparagus knife`)},
      ${toInt($item`little paper umbrella`)},
      ${toInt($item`giant pearl`)}`
    );
    eat($item`diabolic pizza`);
  }

  // craft potions after eating to ensure we have adventures
  if (!getPropertyBoolean('hasRange')) {
    ensureItem(1, $item`Dramatic™ range`);
    use(1, $item`Dramatic™ range`);
  }

  useSkill(1, $skill`Advanced Saucecrafting`);
  ensurePotionEffect($effect`Tomato Power`, $item`tomato juice of powerful power`);
  ensurePotionEffect($effect`Mystically Oiled`, $item`ointment of the occult`);

  ensureEffect($effect`Favored by Lyle`);
  ensureEffect($effect`Starry-Eyed`);
  ensureEffect($effect`Triple-Sized`);
  ensureEffect($effect`Feeling Excited`);
  ensureEffect($effect`Uncucumbered`); // boxing daycare
  haveBeachComb() && ensureEffect($effect`We're All Made of Starfish`); // Beach Comb - should bridge all the way to spell dmg.
  ensureSong($effect`The Magical Mojomuscular Melody`);
  ensureNpcEffect($effect`Glittering Eyelashes`, 5, $item`glittery mascara`);
  ensureEffect($effect`Hulkien`);
  // ensurePullEffect($effect`On the Shoulders of Giants`, $item`Hawking's Elixir of Brilliance`);
  // ensurePullEffect($effect`Perspicacious Pressure`, $item`pressurized potion of perspicacity`);

  // Plan is for these buffs to fall all the way through to item -> hot res -> fam weight.
  ensureEffect($effect`Fidoxene`);
  ensureEffect($effect`Billiards Belligerence`);
  haveBeachComb() && ensureEffect($effect`Do I Know You From Somewhere?`);

  if (haveEffect($effect`Holiday Yoked`) === 0) {
    adventureWithCarolGhost($location`Noob Cave`);
  }

  // eat the sausage gotten during setup now to restore MP
  ensureCreateItem(1, $item`magical sausage`);
  eat($item`magical sausage`);

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

  useSkill($skill`The Ode to Booze`);
  cliExecute("drink Bee's Knees");

  ensureEffect($effect`Blessing of your favorite Bird`); // Should be 75% myst for now.
  ensureSong($effect`Polka of Plenty`);
  haveSkill($skill`Song of Bravado`) && ensureEffect($effect`Song of Bravado`);
}

function doFreeFights() {
  equip($item`fresh coat of paint`);
  equip($item`unwrapped knock-off retro superhero cape`);
  equip($item`weeping willow wand`);
  equip($item`familiar scrapbook`);
  equip($item`Cargo Cultist Shorts`);
  equip($slot`acc1`, $item`hewn moon-rune spoon`);
  equip($slot`acc2`, $item`Brutal brogues`);
  equip($slot`acc3`, $item`backup camera`);

  useFamiliar($familiar`Hovering Sombrero`);

  // Get buff things
  ensureSewerItem(1, $item`turtle totem`);
  ensureSewerItem(1, $item`saucepan`);

  cliExecute('mood cs');
  cliExecute('mood execute');
  // const mood = new Mood();
  // mood.skill($skill`Astral Shell`);
  // mood.skill($skill`Get Big`);
  // mood.skill($skill`Blood Bond`);
  // mood.skill($skill`Blood Bubble`);
  // haveSkill($skill`Carol of the Hells`) && mood.skill($skill`Carol of the Hells`);
  // mood.skill($skill`Drescher's Annoying Noise`);
  // mood.skill($skill`Elemental Saucesphere`);
  // mood.skill($skill`Empathy`);
  // mood.skill($skill`Inscrutable Gaze`);
  // mood.skill($skill`Leash of Linguini`);
  // mood.skill($skill`Pride of the Puffin`);
  // mood.skill($skill`Singer's Faithful Ocelot`);
  // haveSkill($skill`Stevedave's Shanty of Superiority`) &&
  //   mood.skill($skill`Stevedave's Shanty of Superiority`);
  // mood.skill($skill`Ur-Kel's Aria of Annoyance`);
  // mood.skill($skill`Feel Excitement`);
  // mood.execute();

  cliExecute('retrocape mysticality');

  equip($item`familiar scrapbook`);

  // kill the mushroom and chew mushroom tea
  Macro.skill($skill`Barrage of Tears`)
    .skill($skill`Spittoon Monsoon`)
    .skill($skill`saucestorm`)
    .repeat()
    .setAutoAttack();
  adv1($location`Your Mushroom Garden`);
  setAutoAttack(0);
  setChoice(1410, 2);
  adv1($location`Your Mushroom Garden`);
  use($item`free-range mushroom`);
  ensureCreateItem(1, $item`mushroom tea`);
  chew($item`mushroom tea`); // get Mush-Maw (+20 ML), 1 spleen

  // kill a Kramco to prep the back-up camera
  if (sausageFightGuaranteed()) {
    equip($item`Kramco Sausage-o-Matic™`);
    adventureMacroAuto(
      $location`Noob Cave`,
      Macro.if_('!monstername "sausage goblin"', new Macro().step('abort'))
        .trySkill($skill`Feel Pride`)
        .skill($skill`Barrage of Tears`)
        .skill($skill`Spittoon Monsoon`)
        .skill($skill`saucestorm`)
    );
  } else {
    abort('Kramco not ready to start back-up chain');
  }

  // 10x back-up sausage fight @ The Dire Warren with Sombrero
  useFamiliar($familiar`Hovering Sombrero`);
  equip($item`familiar scrapbook`);

  while (get('_backUpUses') < 10) {
    upkeepHpAndMp();

    adventureMacroAuto(
      $location`The Dire Warren`,
      Macro.skill($skill`back-up to your last enemy`)
        .if_('!monstername "sausage goblin"', new Macro().step('abort'))
        .trySkill($skill`Feel Pride`)
        .skill($skill`Barrage of Tears`)
        .skill($skill`Spittoon Monsoon`)
        .skill($skill`saucestorm`)
    );
  }

  restoreHp(myMaxhp());

  // Professor chain off the last back-up
  equip($item`Fourth of May Cosplay Saber`);
  useFamiliar($familiar`Pocket Professor`);

  if (myFamiliarWeight() < 73) abort('not maxing fam weight');

  Macro.trySkill($skill`back-up to your last enemy`)
    .skill($skill`curse of weaksauce`)
    .skill($skill`entangling noodles`)
    .trySkill(Skill.get('Lecture on Relativity'))
    .skill($skill`Spittoon Monsoon`)
    .skill($skill`saucegeyser`)
    .setAutoAttack();
  adv1($location`The Dire Warren`);
  while (inMultiFight()) runCombat();

  setAutoAttack(0);
  cliExecute('mood apathetic');
}

function postGoblins() {
  // cast needed things
  useSkill(1, $skill`Bowl Full of Jelly`);
  useSkill(1, $skill`Eye and a Twist`);
  useSkill(1, $skill`Pastamastery`);
  useSkill(1, $skill`Spaghetti Breakfast`);
  useSkill(1, $skill`Grab a Cold One`);
  useSkill(1, $skill`Acquire Rhinestones`);
  useSkill(1, $skill`Prevent Scurvy and Sobriety`);
  haveSkill($skill`Perfect Freeze`) && useSkill(1, $skill`Perfect Freeze`);
  useSkill(1, $skill`Chubby and Plump`);
  useSkill(1, $skill`Summon Crimbo Candy`);

  autosell(3, $item`magical ice cubes`);
  autosell(3, $item`little paper umbrella`);

  // eat food unrelated to tests
  eat($item`bowl full of jelly`);
  cliExecute('pillkeeper semirare');
  adv1($location`The Haunted Pantry`);
  eat(3, $item`tasty tart`);
}

function doHpTest() {
  ensurePotionEffect($effect`Expert Oiliness`, $item`oil of expertise`);

  if (haveEffect($effect`Carlweather's Cantata of Confrontation`) > 0) {
    cliExecute("shrug Carlweather's Cantata of Confrontation");
  }

  use($item`Chubby and Plump bar`);

  maximize('hp', false);

  // QUEST - Donate Blood (HP)
  if (myMaxhp() - myBuffedstat($stat`muscle`) - 3 < 1770) {
    throw 'Not enough HP to cap.';
  }

  doTest(Test.HP);
}

function doMoxTest() {
  if (myClass() === $class`Pastamancer`) useSkill(1, $skill`Bind Penne Dreadful`);
  else ensurePotionEffect($effect`Expert Oiliness`, $item`oil of expertise`);

  // Sauceror has 75% moxie bird
  use(1, $item`Bird-a-Day Calendar`);
  ensureEffect($effect`Blessing of the Bird`);

  ensureEffect($effect`Big`);
  // ensureEffect($effect`Song of Bravado`);
  // ensureSong($effect`Stevedave's Shanty of Superiority`);
  ensureSong($effect`The Moxious Madrigal`);
  // ensureEffect($effect`Quiet Desperation`);
  // ensureEffect($effect`Disco Fever`);
  // ensureEffect($effect`Blubbered Up`);
  // ensureEffect($effect`Mariachi Mood`);
  ensureNpcEffect($effect`Butt-Rock Hair`, 5, $item`hair spray`);
  use(availableAmount($item`rhinestone`), $item`rhinestone`);
  if (haveEffect($effect`Unrunnable Face`) === 0) {
    tryUse(1, $item`runproof mascara`);
  }
  cliExecute('retrocape moxie');

  maximize('moxie', false);

  use($item`pocket maze`);

  if (myBuffedstat($stat`moxie`) - myBasestat($stat`moxie`) < 1770) {
    throw 'Not enough moxie to cap.';
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
  ensureNpcEffect($effect`Go Get 'Em, Tiger!`, 5, $item`Ben-Gal™ balm`);
  cliExecute('retrocape muscle');

  haveFamiliar($familiar`Left-Hand Man`) && useFamiliar($familiar`Left-Hand Man`);
  maximize('muscle', false);

  // for (const increaser of [
  //   () => ensureEffect($effect`Ham-Fisted`),
  // ]) {
  //   if (myBuffedstat($stat`muscle`) - myBasestat($stat`mysticality`) < 1770) increaser();
  // }

  use($item`shady shades`);

  if (myBuffedstat($stat`muscle`) - myBasestat($stat`muscle`) < 1770) {
    throw 'Not enough muscle to cap.';
  }

  doTest(Test.MUS);
}

function doItemTest() {
  useFamiliar($familiar`none`);

  // cyclops eyedrops
  if (!haveEffect($effect`One Very Clear Eye`)) {
    cliExecute('pillkeeper semirare');
    adv1($location`The Limerick Dungeon`);
    use($item`cyclops eyedrops`);
  }

  // Create CER pizza
  if (!haveEffect($effect`Certainty`)) {
    visitUrl(
      `campground.php?action=makepizza&pizza=
      ${toInt($item`coconut shell`)},
      ${toInt($item`eggbeater`)},
      ${toInt($item`razor-sharp can lid`)},
      ${toInt($item`Newbiesport™ tent`)}`
    );
    eat($item`diabolic pizza`);
  }

  !get('_clanFortuneBuffUsed') && cliExecute('fortune buff item');
  !haveEffect($effect`Infernal Thirst`) && cliExecute('genie effect Infernal Thirst');
  !haveEffect($effect`Lantern-Charged`) && use($item`battery (lantern)`);
  ensureEffect($effect`Feeling Lost`);
  ensureEffect($effect`Singer's Faithful Ocelot`);
  ensureEffect($effect`Fat Leon's Phat Loot Lyric`);
  ensureEffect($effect`Steely-Eyed Squint`);
  ensureEffect($effect`Nearly All-Natural`); // bag of grain
  equip($item`Kramco Sausage-o-Matic™`);

  // Tune moon sign to Opossum.
  if (!getPropertyBoolean('moonTuned')) {
    if (getPropertyInt('_campAwaySmileBuffs') === 0) {
      visitUrl('place.php?whichplace=campaway&action=campaway_sky');
    }

    // Unequip spoon.
    equip($slot`acc1`, $item`Retrospecs`);
    equip($slot`acc2`, $item`Powerful Glove`);
    equip($slot`acc3`, $item`Lil' Doctor™ Bag`);

    // Actually tune the moon. To Opossum.
    visitUrl('inv_use.php?whichitem=10254&doit=96&whichsign=5');
  }

  maximize(
    'item, 2 booze drop, -equip broken champagne bottle, -equip surprisingly capacious handbag',
    false
  );

  if (itemTurns() > 10) {
    abort('Not going to finish item test in less than 10 turns');
  }

  doTest(Test.ITEM);

  equip($item`familiar scrapbook`);
}

function doFamiliarTest() {
  if (myHp() < 30) useSkill(1, $skill`Cannelloni Cocoon`);
  ensureEffect($effect`Blood Bond`);
  ensureEffect($effect`Leash of Linguini`);
  ensureEffect($effect`Empathy`);

  // These should have fallen through all the way from leveling.
  // ensureEffect($effect`Fidoxene`);
  ensureEffect($effect`Billiards Belligerence`);

  useFamiliar($familiar`Exotic Parrot`); // set any fam for Fidoxene boosts
  maximize('familiar weight', false);

  if (myAdventures() < 46) {
    abort("don't think we have advs to knock out fam weight");
  }

  if (myFamiliarWeight() < 73) abort('fam weight not high enough');

  doTest(Test.FAMILIAR);
}

function doWeaponTest() {
  // fax and lick ungulith
  if (availableAmount($item`photocopied monster`) === 0 && !get('_photocopyUsed')) {
    chatPrivate('cheesefax', 'ungulith');
    for (let i = 0; i < 2; i++) {
      wait(10);
      cliExecute('fax receive');
      if (getProperty('photocopyMonster') === 'ungulith') break;
      // otherwise got the wrong monster, put it back.
      cliExecute('fax send');
    }
    if (availableAmount($item`photocopied monster`) === 0) throw 'Failed to fax in ungulith.';

    cliExecute('mood apathetic');
    Macro.skill($skill`shocking lick`).setAutoAttack();
    use(1, $item`photocopied monster`);
    setAutoAttack(0);
  }

  // OU pizza (pulverize saucepan for useless powder)
  if (!haveEffect($effect`Outer Wolf™`)) {
    ensureItem(1, $item`tenderizing hammer`);
    availableAmount($item`useless powder`) === 0 && cliExecute('pulverize saucepan');
    visitUrl(
      `campground.php?action=makepizza&pizza=
      ${toInt($item`oil of expertise`)},
      ${toInt($item`useless powder`)},
      ${toInt($item`tomato juice of powerful power`)},
      ${toInt($item`antique packet of ketchup`)}`
    );
    eat($item`diabolic pizza`);
  }

  if (haveEffect($effect`Do You Crush What I Crush?`) === 0) {
    adventureWithCarolGhost($location`The Outskirts of Cobb's Knob`);
  }

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

  // ensureEffect($effect`Carol of the Bulls`);
  ensureEffect($effect`Song of the North`);
  // ensureEffect($effect`Rage of the Reindeer`);
  // ensureEffect($effect`Frenzied, Bloody`);
  // ensureEffect($effect`Scowl of the Auk`);
  // ensureEffect($effect`Disdain of the War Snapper`);
  // ensureEffect($effect`Tenacity of the Snapper`);
  // ensureSong($effect`Jackasses' Symphony of Destruction`);
  ensureEffect($effect`Billiards Belligerence`);
  // ensureNpcEffect($effect`Engorged Weapon`, 1, $item`Meleegra&trade; pills`); Gnome camp
  ensureEffect($effect`Cowrruption`); // Corrupted marrow
  ensureEffect($effect`Bow-Legged Swagger`);

  cliExecute('boombox fists');
  if (!haveEffect($effect`Rictus of Yeg`)) {
    cliExecute('cargo pick 284');
    use($item`Yeg's Motel toothbrush`);
  }

  maximize('weapon damage', false);

  const weaponTurns = () =>
    60 -
    Math.floor(numericModifier('weapon damage') / 25 + 0.001) -
    Math.floor(numericModifier('weapon damage percent') / 25 + 0.001);

  if (weaponTurns() > 24) {
    throw 'Something went wrong with weapon damage.';
  }

  doTest(Test.WEAPON);
}

function doSpellTest() {
  ensureEffect($effect`Simmering`);

  ensureEffect($effect`Song of Sauce`);
  ensureEffect($effect`AAA-Charged`);
  // ensureEffect($effect`Carol of the Hells`);
  // ensureEffect($effect`Arched Eyebrow of the Archmage`);
  // ensureSong($effect`Jackasses' Symphony of Destruction`);

  // Pool buff
  // ensureEffect($effect`Mental A-cue-ity`);

  // Tea party
  if (!getPropertyBoolean('_madTeaParty')) {
    ensureSewerItem(1, $item`mariachi hat`);
    ensureEffect($effect`Full Bottle in front of Me`);
  }

  if (haveEffect($effect`Do You Crush What I Crush?`) === 0) {
    adventureWithCarolGhost($location`The Outskirts of Cobb's Knob`);
  }

  useSkill(1, $skill`Spirit of Cayenne`);

  if (availableAmount($item`LOV Elixir #6`) > 0) ensureEffect($effect`The Magic of LOV`);

  ensureEffect($effect`Elemental Saucesphere`);
  ensureEffect($effect`Astral Shell`);
  if (haveEffect($effect`Feeling Peaceful`) === 0) useSkill($skill`Feel Peaceful`);

  // Deep Dark Visions
  useFamiliar($familiar`Exotic Parrot`);

  cliExecute('retrocape vampire hold');

  // Mafia sometimes can't figure out that multiple +weight things would get us to next tier.
  maximize('hot res, 0.01 familiar weight', false);
  if (haveEffect($effect`Visions of the Deep Dark Deeps`) < 50) {
    if (myMp() < 20) {
      ensureCreateItem(1, $item`magical sausage`);
      eat(1, $item`magical sausage`);
    }
    while (myHp() < myMaxhp()) {
      useSkill(1, $skill`Cannelloni Cocoon`);
    }
    if (myMp() < 100) {
      ensureCreateItem(1, $item`magical sausage`);
      eat(1, $item`magical sausage`);
    }
    if (Math.round(numericModifier('spooky resistance')) < 10) {
      ensureEffect($effect`Does It Have a Skull In There??`);
      if (Math.round(numericModifier('spooky resistance')) < 10) {
        throw 'Not enough spooky res for Deep Dark Visions.';
      }
    }
    useSkill(1, $skill`Deep Dark Visions`);
  }

  maximize('spell damage', false);

  if (Math.round(numericModifier('spell damage percent')) % 50 >= 40) {
    ensureItem(1, $item`soda water`);
    ensurePotionEffect($effect`Concentration`, $item`cordial of concentration`);
  }

  const spellTurns = () =>
    60 -
    Math.floor(numericModifier('spell damage') / 50 + 0.001) -
    Math.floor(numericModifier('spell damage percent') / 50 + 0.001);

  if (spellTurns() > 43 || myAdventures() < 43) {
    abort('spell test taking too long');
  }

  while (spellTurns() > myAdventures()) {
    eat(1, $item`magical sausage`);
  }

  doTest(Test.SPELL);
}

function doHotResTest() {
  // Make sure no moon spoon.
  equip($slot`acc1`, $item`Eight Days a Week Pill Keeper`);
  equip($slot`acc2`, $item`Powerful Glove`);
  equip($slot`acc3`, $item`Lil' Doctor™ Bag`);

  // These should have fallen through all the way from leveling.
  // ensureEffect($effect`Fidoxene`);
  // ensureEffect($effect`Billiards Belligerence`);

  ensureItem(1, $item`tenderizing hammer`);
  cliExecute('smash * ratty knitted cap');
  cliExecute('smash * red-hot sausage fork');
  autosell(10, $item`hot nuggets`);
  autosell(10, $item`twinkly powder`);

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
  if (haveEffect($effect`Feeling Peaceful`) === 0) useSkill($skill`Feel Peaceful`);
  ensureEffect($effect`Blood Bond`);
  ensureEffect($effect`Leash of Linguini`);
  ensureEffect($effect`Empathy`);

  if (haveEffect($effect`Let It Snow/Boil/Stink/Frighten/Grease`) === 0) {
    adventureWithCarolGhost($location`The Haunted Kitchen`);
  }

  useFamiliar($familiar`Exotic Parrot`);

  cliExecute('retrocape vampire hold');

  // Mafia sometimes can't figure out that multiple +weight things would get us to next tier.
  maximize('hot res, 0.01 familiar weight', false);

  !haveEffect($effect`Fireproof Lips`) && wishEffect($effect`Fireproof Lips`);

  useSkill($skill`The Ode to Booze`);
  cliExecute('drink Ish Kabibble');

  if (Math.round(numericModifier('hot resistance')) < 35 || myAdventures() < 25) {
    abort('Something went wrong building hot res.');
  }

  doTest(Test.HOT_RES);
}

function doNonCombatTest() {
  useFamiliar($familiar`Disgeist`);

  if (myHp() < 30) useSkill(1, $skill`Cannelloni Cocoon`);
  ensureEffect($effect`Blood Bond`);
  ensureEffect($effect`Leash of Linguini`);
  ensureEffect($effect`Empathy`);

  // These should have fallen through all the way from leveling.
  // ensureEffect($effect`Fidoxene`);
  // ensureEffect($effect`Billiards Belligerence`);

  equip($slot`acc3`, $item`Powerful Glove`);
  equip($item`fish hatchet`);

  ensureEffect($effect`The Sonata of Sneakiness`);
  ensureEffect($effect`Smooth Movements`);
  ensureEffect($effect`Invisible Avatar`);
  ensureEffect($effect`Silent Running`);
  ensureEffect($effect`Feeling Lonely`);

  ensureEffect($effect`A Rose by Any Other Material`);

  wishEffect($effect`Disquiet Riot`);

  if (Math.round(numericModifier('combat rate')) > -40 + 9) {
    throw 'Not enough -combat to cap.';
  }

  if (myAdventures() < 9) {
    throw 'not enough adventures to do non combat';
  }

  doTest(Test.NONCOMBAT);
}

export function main(argString = '') {
  const START_TIME = gametimeToInt();
  setAutoAttack(0);

  if (myTurncount() < 60) {
    if (userConfirm('Do setup?', 55000, false)) {
      setup();
    }
    doTest(Test.COIL_WIRE);
  }

  if (myTurncount() < 60) throw 'Something went wrong coiling wire.';

  if (myLevel() < 12) {
    useStatGains();
    buffBeforeGoblins();
    doFreeFights();
    postGoblins();
  }

  if (!testDone(Test.MYS)) {
    maximize('mysticality', false);
    if (myBuffedstat($stat`mysticality`) - myBasestat($stat`mysticality`) < 1770) {
      throw 'Not enough mysticality to cap.';
    }

    doTest(Test.MYS);
  }

  if (!testDone(Test.HP)) {
    doHpTest();
  }

  if (!testDone(Test.MOX)) {
    doMoxTest();
  }

  if (!testDone(Test.MUS)) {
    doMusTest();
  }

  if (
    availableAmount($item`astral six-pack`) === 1 ||
    availableAmount($item`astral pilsner`) >= 5
  ) {
    tryUse(1, $item`astral six-pack`);
    useSkill(2, $skill`The Ode to Booze`);
    drink(6, $item`astral pilsner`);
    drink(1, $item`Cold One`);
    drink(1, $item`Eye and a Twist`);
  }

  if (!testDone(Test.ITEM)) {
    doItemTest();
  }

  if (!testDone(Test.FAMILIAR)) {
    doFamiliarTest();
  }

  if (!testDone(Test.WEAPON)) {
    doWeaponTest();
  }

  if (!testDone(Test.SPELL)) {
    doSpellTest();
  }

  if (!testDone(Test.HOT_RES)) {
    doHotResTest();
  }

  if (!testDone(Test.NONCOMBAT)) {
    doNonCombatTest();
  }

  if (!testDone(Test.DONATE)) {
    doTest(Test.DONATE);
  }

  setProperty('autoSatisfyWithNPCs', getProperty('_saved_autoSatisfyWithNPCs'));
  setProperty('autoSatisfyWithCoinmasters', getProperty('_saved_autoSatisfyWithCoinmasters'));
  setProperty('hpAutoRecovery', '0.8');

  cliExecute('mood default');
  cliExecute('ccs default');
  cliExecute('boombox food');

  print(`Finished in ${(gametimeToInt() - START_TIME) / 1000} seconds.`, 'green');
}
