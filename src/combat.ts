import { Macro, $skill } from 'libram';

let COMBAT_MACROS = {
  nostEnvyFreeKill: function (monsterName: string, useNostalgia = true): Macro {
    return Macro.step('mark start')
      .if_(
        `monstername ${monsterName}`,
        Macro.externalIf(useNostalgia, Macro.skill($skill`Feel Nostalgic`))
          .skill($skill`Feel Envy`)
          .skill($skill`Chest X-Ray`)
      )
      .skill('CHEAT CODE: Replace Enemy')
      .step('goto start');
  },
  envyFreeKill: function (monsterName: string): Macro {
    return this.nostEnvyFreeKill(monsterName, false);
  },
};

function main(): void {
  Macro.load().submit();
}

export { COMBAT_MACROS, main };
