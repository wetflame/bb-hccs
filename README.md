# bb-hccs

This is a Kingdom of Loathing script originally taken from bean-hccs, `worthawholebean (#1972588)` (`ikzann#8468` on Discord) to do 1-day Softcore Community Service runs as a Sauceror. I use it daily for ~1/180 softcore CS runs. Expect to need to make some changes, unless your set of IotMs is a strict superset of mine. For most folks, this will be an outline that can get you to daycount with some customization work.

You'll have to build this yourself to make modifications. This use a typical node.js / babel / webpack setup. To install:
- Install node.js.
- Checkout the repository somewhere outside your mafia folder.
- Run `npm install` and `npm build`
- Symbolic link the build folder (`KoLmafia/scripts/bean-hccs`) into your mafia directory, as well as `KoLmafia/ccs/bean-hccs.ccs`. Or make a copy every time you update.
- Run `npm run watch` as you make changes and the build folder will automatically update.

The script is NOT fine to run twice unless you know what you're doing.

Notes:
- I currently take an astral statuette and ascend Wallaby sign. I run the mushroom garden and Pizza Cube.
- The script assumes that you have a bunch of IotMs. if you are missing more than one or two of the leveling ones in particular (Prof/Kramco, NEP, Garbage Tote), your modifications to the script will fail to level enough to cap the stat tests. That will very likely mean missing daycount. 
- Besides leveling, the Genie Bottle and Pizza Cube each save a ridiculous number of turns with wishes.
- You can assume that (almost) everything in my cc_snapshot is used.
- Finally, it assumes that you have access to essentially every CS-relevant perm. The big ones are the +HP% perms, as they allow you to avoid using a wish on the HP test. If you don't have the Cargo Cultist Shorts, you will need Song of Starch (50%), Spirit of Ravioli (25%), and Abs of Tin (10%) at the very least, and you probably also need one or two of the 5% perms. If you don't have these perms yet, you will need to use a wish/pizza for Preemptive Medicine on the HP test. Bow-Legged Swagger and Steely-Eyed Squint are also crucial, as you would expect. And there are quite a few miscellaneous +item and +weapon damage perms; they all save turns, many of them several.
- Note especially that Meteor Guide is insanely good and saves 16 turns though the Saber/Meteor Showered combination.
- Outside those IotMs, this path really rewards having a long tail of relevant items: +5 familiar weight here, 100% spell damage there, etc. It is hard to get around that fact if you want to make your runs faster.

The script is intended to be in the public domain. Please feel free to modify and distribute how you wish.
