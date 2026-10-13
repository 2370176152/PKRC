// Import three level-100 Pokemon into the explicitly selected online save slot.
// Run on pokerogue.net. The source Pokemon and their bound item modifiers are embedded below.
// Embedded source data is plain JSON, not encrypted or base64 encoded.
// The selected online slot must have three free party spaces.
(async () => {
  const TARGET_USERNAME = "naoshimian";
  const TARGET_SLOT = 0; // 0-4; 0 is the main slot.
  const API_BASE = "https://api.pokerogue.net";
  const SAVE_KEY = "x0i2O7WRiANTqPmZ";
  const MAX_PARTY_SIZE = 6;
  const SCRIPT_MARKER = "__fusedPokemonConsoleClone_v4";
  const SESSION_PREFIX = "sessionData";
  const SYSTEM_KEY = `data_${TARGET_USERNAME}`;
  const sessionStorageKey = `${SESSION_PREFIX}${TARGET_SLOT || ""}_${TARGET_USERNAME}`;
  const EMBEDDED_SOURCE = {
    "pokemon": [
      {
        "abilityIndex": 0,
        "battleData": {
          "berriesEaten": null,
          "hasEatenBerry": false
        },
        "boss": false,
        "bossSegments": 0,
        "customPokemonData": {
          "ability": -1,
          "nature": -1,
          "passive": 256,
          "spriteScale": -1,
          "types": [
            11,
            8
          ]
        },
        "exp": 1059860,
        "formIndex": 1,
        "friendship": 255,
        "fusionAbilityIndex": 0,
        "fusionCustomPokemonData": {
          "ability": 126,
          "nature": 15,
          "passive": -1,
          "spriteScale": -1,
          "types": [
            11,
            8
          ]
        },
        "fusionFormIndex": 1,
        "fusionGender": 0,
        "fusionLuck": 3,
        "fusionShiny": true,
        "fusionSpecies": 890,
        "fusionTeraType": 18,
        "fusionVariant": 2,
        "gender": 1,
        "hp": 2231,
        "id": 1736079567,
        "isTerastallized": false,
        "ivs": [
          31,
          31,
          31,
          31,
          31,
          31
        ],
        "level": 100,
        "levelExp": -21390,
        "luck": 3,
        "metBiome": -1,
        "metLevel": 5,
        "metSpecies": 495,
        "metWave": -1,
        "moveset": [
          {
            "moveId": 902,
            "ppUp": 3,
            "ppUsed": 0
          },
          {
            "moveId": 464,
            "ppUp": 3,
            "ppUsed": 0
          },
          {
            "moveId": 874,
            "ppUp": 3,
            "ppUsed": 0
          },
          {
            "moveId": 890,
            "ppUp": 3,
            "ppUsed": 0
          }
        ],
        "nature": 15,
        "nickname": "",
        "passive": true,
        "pauseEvolutions": false,
        "player": true,
        "pokeball": 0,
        "pokerus": false,
        "shiny": true,
        "species": 890,
        "stats": [
          2231,
          26,
          586,
          639,
          586,
          1102
        ],
        "status": 0,
        "stellarTypesBoosted": null,
        "summonData": {
          "abilitiesApplied": null,
          "abilitySuppressed": false,
          "berriesEatenLast": null,
          "hitCount": 0,
          "moveHistory": null,
          "moveQueue": null,
          "statStages": [
            0,
            0,
            0,
            0,
            0,
            0,
            0
          ],
          "stats": [
            0,
            0,
            0,
            0,
            0,
            0
          ],
          "tags": null,
          "types": null
        },
        "teraType": 18,
        "usedTMs": null,
        "variant": 2,
        "maxHp": 0,
        "sleepTurns": 0,
        "atk": 0,
        "def": 0,
        "spAtk": 0,
        "spDef": 0,
        "speed": 0
      },
      {
        "abilityIndex": 0,
        "battleData": {
          "berriesEaten": null,
          "hasEatenBerry": false
        },
        "boss": false,
        "bossSegments": 0,
        "customPokemonData": {
          "ability": -1,
          "nature": 3,
          "passive": 53,
          "spriteScale": -1,
          "types": [
            18,
            18
          ]
        },
        "exp": 1250000,
        "formIndex": 0,
        "friendship": 139,
        "fusionAbilityIndex": 0,
        "fusionCustomPokemonData": {
          "ability": 25,
          "nature": 13,
          "passive": -1,
          "spriteScale": -1,
          "types": [
            18,
            18
          ]
        },
        "fusionFormIndex": 0,
        "fusionLuck": 3,
        "fusionShiny": true,
        "fusionSpecies": 798,
        "fusionTeraType": 18,
        "fusionVariant": 2,
        "gender": 0,
        "hp": 1,
        "id": 1079846758,
        "isTerastallized": false,
        "ivs": [
          31,
          31,
          31,
          31,
          31,
          31
        ],
        "level": 100,
        "levelExp": 168750,
        "luck": 3,
        "metBiome": 9,
        "metLevel": 15,
        "metSpecies": 194,
        "metWave": 23,
        "moveset": [
          {
            "moveId": 206,
            "ppUp": 0,
            "ppUsed": 0
          },
          {
            "moveId": 464,
            "ppUp": 2,
            "ppUsed": 0
          },
          {
            "moveId": 147,
            "ppUp": 2,
            "ppUsed": 0
          },
          {
            "moveId": 860,
            "ppUp": 0,
            "ppUsed": 0
          }
        ],
        "nature": 13,
        "nickname": "",
        "passive": true,
        "pauseEvolutions": false,
        "player": true,
        "pokeball": 0,
        "pokerus": false,
        "shiny": true,
        "species": 798,
        "stats": [
          1,
          438,
          298,
          138,
          98,
          254
        ],
        "status": 0,
        "stellarTypesBoosted": null,
        "summonData": {
          "abilitiesApplied": [
            53
          ],
          "abilitySuppressed": false,
          "berriesEatenLast": null,
          "hitCount": 0,
          "moveHistory": null,
          "moveQueue": null,
          "statStages": [
            0,
            0,
            0,
            0,
            0,
            0,
            0
          ],
          "stats": [
            0,
            0,
            0,
            0,
            0,
            0
          ],
          "tags": null,
          "types": null
        },
        "teraType": 18,
        "usedTMs": null,
        "variant": 2,
        "maxHp": 0,
        "sleepTurns": 0,
        "atk": 0,
        "def": 0,
        "spAtk": 0,
        "spDef": 0,
        "speed": 0
      },
      {
        "abilityIndex": 0,
        "battleData": {
          "berriesEaten": null,
          "hasEatenBerry": false
        },
        "boss": false,
        "bossSegments": 0,
        "customPokemonData": {
          "ability": -1,
          "nature": -1,
          "passive": 98,
          "spriteScale": -1,
          "types": [
            18,
            18
          ]
        },
        "exp": 257692,
        "formIndex": 1,
        "friendship": 59,
        "fusionAbilityIndex": 0,
        "fusionCustomPokemonData": {
          "ability": 25,
          "nature": 14,
          "passive": -1,
          "spriteScale": -1,
          "types": [
            18,
            18
          ]
        },
        "fusionFormIndex": 1,
        "fusionLuck": 3,
        "fusionShiny": true,
        "fusionSpecies": 386,
        "fusionTeraType": 18,
        "fusionVariant": 2,
        "gender": 1,
        "hp": 1,
        "id": 275408260,
        "isTerastallized": true,
        "ivs": [
          31,
          31,
          31,
          31,
          31,
          31
        ],
        "level": 100,
        "levelExp": -823558,
        "luck": 3,
        "metBiome": 10,
        "metLevel": 31,
        "metSpecies": 977,
        "metWave": 16,
        "moveset": [
          {
            "moveId": 906,
            "ppUp": 3,
            "ppUsed": 0
          },
          {
            "moveId": 920,
            "ppUp": 3,
            "ppUsed": 0
          },
          {
            "moveId": 504,
            "ppUp": 3,
            "ppUsed": 0
          },
          {
            "moveId": 617,
            "ppUp": 3,
            "ppUsed": 0
          }
        ],
        "nature": 14,
        "nickname": "",
        "passive": true,
        "pauseEvolutions": false,
        "player": true,
        "pokeball": 0,
        "pokerus": false,
        "shiny": true,
        "species": 386,
        "stats": [
          1,
          400,
          80,
          420,
          5,
          710
        ],
        "status": 0,
        "stellarTypesBoosted": null,
        "summonData": {
          "abilitiesApplied": null,
          "abilitySuppressed": false,
          "berriesEatenLast": null,
          "hitCount": 0,
          "moveHistory": null,
          "moveQueue": null,
          "statStages": [
            0,
            0,
            0,
            0,
            0,
            0,
            0
          ],
          "stats": [
            0,
            0,
            0,
            0,
            0,
            0
          ],
          "tags": null,
          "types": null
        },
        "teraType": 18,
        "usedTMs": null,
        "variant": 2,
        "maxHp": 0,
        "sleepTurns": 0,
        "atk": 0,
        "def": 0,
        "spAtk": 0,
        "spDef": 0,
        "speed": 0
      }
    ],
    "modifiers": [
      {
        "args": [
          1736079567
        ],
        "className": "PokemonMultiHitModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "MULTI_LENS"
      },
      {
        "args": [
          1736079567,
          10
        ],
        "className": "ContactHeldItemTransferChanceModifier",
        "player": true,
        "stackCount": 5,
        "typeId": "GRIP_CLAW"
      },
      {
        "args": [
          1736079567
        ],
        "className": "TurnHeldItemTransferModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "MINI_BLACK_HOLE"
      },
      {
        "args": [
          1736079567,
          5
        ],
        "className": "BaseStatModifier",
        "player": true,
        "stackCount": 31,
        "typeId": "BASE_STAT_BOOSTER",
        "typePregenArgs": [
          5
        ]
      },
      {
        "args": [
          1736079567,
          4,
          20
        ],
        "className": "AttackTypeBoosterModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "ATTACK_TYPE_BOOSTER",
        "typePregenArgs": [
          4
        ]
      },
      {
        "args": [
          1736079567,
          0
        ],
        "className": "BaseStatModifier",
        "player": true,
        "stackCount": 31,
        "typeId": "BASE_STAT_BOOSTER",
        "typePregenArgs": [
          0
        ]
      },
      {
        "args": [
          1736079567,
          5
        ],
        "className": "PokemonMoveAccuracyBoosterModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "WIDE_LENS"
      },
      {
        "args": [
          1736079567
        ],
        "className": "TurnHealModifier",
        "player": true,
        "stackCount": 2,
        "typeId": "LEFTOVERS"
      },
      {
        "args": [
          1736079567
        ],
        "className": "PokemonNatureWeightModifier",
        "player": true,
        "stackCount": 8,
        "typeId": "SOUL_DEW"
      },
      {
        "args": [
          1736079567,
          12,
          20
        ],
        "className": "AttackTypeBoosterModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "ATTACK_TYPE_BOOSTER",
        "typePregenArgs": [
          12
        ]
      },
      {
        "args": [
          1736079567,
          3
        ],
        "className": "BaseStatModifier",
        "player": true,
        "stackCount": 2,
        "typeId": "BASE_STAT_BOOSTER",
        "typePregenArgs": [
          3
        ]
      },
      {
        "args": [
          1736079567,
          14,
          20
        ],
        "className": "AttackTypeBoosterModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "ATTACK_TYPE_BOOSTER",
        "typePregenArgs": [
          14
        ]
      },
      {
        "args": [
          1736079567
        ],
        "className": "DamageMoneyRewardModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "GOLDEN_PUNCH"
      },
      {
        "args": [
          1736079567,
          13,
          20
        ],
        "className": "AttackTypeBoosterModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "ATTACK_TYPE_BOOSTER",
        "typePregenArgs": [
          13
        ]
      },
      {
        "args": [
          1736079567,
          0
        ],
        "className": "BerryModifier",
        "player": true,
        "stackCount": 2,
        "typeId": "BERRY",
        "typePregenArgs": [
          0
        ]
      },
      {
        "args": [
          1736079567,
          1,
          20
        ],
        "className": "AttackTypeBoosterModifier",
        "player": true,
        "stackCount": 3,
        "typeId": "ATTACK_TYPE_BOOSTER",
        "typePregenArgs": [
          1
        ]
      },
      {
        "args": [
          1736079567,
          17,
          20
        ],
        "className": "AttackTypeBoosterModifier",
        "player": true,
        "stackCount": 2,
        "typeId": "ATTACK_TYPE_BOOSTER",
        "typePregenArgs": [
          17
        ]
      },
      {
        "args": [
          1736079567,
          7
        ],
        "className": "BerryModifier",
        "player": true,
        "stackCount": 3,
        "typeId": "BERRY",
        "typePregenArgs": [
          7
        ]
      },
      {
        "args": [
          1736079567,
          3
        ],
        "className": "BerryModifier",
        "player": true,
        "stackCount": 3,
        "typeId": "BERRY",
        "typePregenArgs": [
          3
        ]
      },
      {
        "args": [
          1736079567,
          4
        ],
        "className": "BerryModifier",
        "player": true,
        "stackCount": 3,
        "typeId": "BERRY",
        "typePregenArgs": [
          4
        ]
      },
      {
        "args": [
          1736079567,
          2,
          20
        ],
        "className": "AttackTypeBoosterModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "ATTACK_TYPE_BOOSTER",
        "typePregenArgs": [
          2
        ]
      },
      {
        "args": [
          1736079567,
          6
        ],
        "className": "BerryModifier",
        "player": true,
        "stackCount": 3,
        "typeId": "BERRY",
        "typePregenArgs": [
          6
        ]
      },
      {
        "args": [
          1736079567,
          10,
          20
        ],
        "className": "AttackTypeBoosterModifier",
        "player": true,
        "stackCount": 2,
        "typeId": "ATTACK_TYPE_BOOSTER",
        "typePregenArgs": [
          10
        ]
      },
      {
        "args": [
          1736079567
        ],
        "className": "SurviveDamageModifier",
        "player": true,
        "stackCount": 3,
        "typeId": "FOCUS_BAND"
      },
      {
        "args": [
          1736079567,
          15,
          20
        ],
        "className": "AttackTypeBoosterModifier",
        "player": true,
        "stackCount": 2,
        "typeId": "ATTACK_TYPE_BOOSTER",
        "typePregenArgs": [
          15
        ]
      },
      {
        "args": [
          1736079567,
          40
        ],
        "className": "PokemonExpBoosterModifier",
        "player": true,
        "stackCount": 2,
        "typeId": "LUCKY_EGG"
      },
      {
        "args": [
          1736079567,
          9,
          20
        ],
        "className": "AttackTypeBoosterModifier",
        "player": true,
        "stackCount": 3,
        "typeId": "ATTACK_TYPE_BOOSTER",
        "typePregenArgs": [
          9
        ]
      },
      {
        "args": [
          1736079567,
          9
        ],
        "className": "BerryModifier",
        "player": true,
        "stackCount": 3,
        "typeId": "BERRY",
        "typePregenArgs": [
          9
        ]
      },
      {
        "args": [
          1736079567,
          3,
          20
        ],
        "className": "AttackTypeBoosterModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "ATTACK_TYPE_BOOSTER",
        "typePregenArgs": [
          3
        ]
      },
      {
        "args": [
          1736079567,
          1
        ],
        "className": "BerryModifier",
        "player": true,
        "stackCount": 2,
        "typeId": "BERRY",
        "typePregenArgs": [
          1
        ]
      },
      {
        "args": [
          1736079567,
          5
        ],
        "className": "BerryModifier",
        "player": true,
        "stackCount": 3,
        "typeId": "BERRY",
        "typePregenArgs": [
          5
        ]
      },
      {
        "args": [
          1736079567,
          11,
          20
        ],
        "className": "AttackTypeBoosterModifier",
        "player": true,
        "stackCount": 2,
        "typeId": "ATTACK_TYPE_BOOSTER",
        "typePregenArgs": [
          11
        ]
      },
      {
        "args": [
          1736079567,
          7,
          20
        ],
        "className": "AttackTypeBoosterModifier",
        "player": true,
        "stackCount": 2,
        "typeId": "ATTACK_TYPE_BOOSTER",
        "typePregenArgs": [
          7
        ]
      },
      {
        "args": [
          1736079567,
          5,
          20
        ],
        "className": "AttackTypeBoosterModifier",
        "player": true,
        "stackCount": 2,
        "typeId": "ATTACK_TYPE_BOOSTER",
        "typePregenArgs": [
          5
        ]
      },
      {
        "args": [
          1736079567
        ],
        "className": "HitHealModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "SHELL_BELL"
      },
      {
        "args": [
          1736079567,
          2
        ],
        "className": "BaseStatModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "BASE_STAT_BOOSTER",
        "typePregenArgs": [
          2
        ]
      },
      {
        "args": [
          1079846758
        ],
        "className": "PokemonInstantReviveModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "REVIVER_SEED"
      },
      {
        "args": [
          1079846758
        ],
        "className": "FlinchChanceModifier",
        "player": true,
        "stackCount": 2,
        "typeId": "KINGS_ROCK"
      },
      {
        "args": [
          1079846758,
          3
        ],
        "className": "BerryModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "BERRY",
        "typePregenArgs": [
          3
        ]
      },
      {
        "args": [
          1736079567,
          4
        ],
        "className": "BaseStatModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "BASE_STAT_BOOSTER",
        "typePregenArgs": [
          4
        ]
      },
      {
        "args": [
          1079846758
        ],
        "className": "PokemonFriendshipBoosterModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "SOOTHE_BELL"
      },
      {
        "args": [
          1079846758,
          10
        ],
        "className": "BerryModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "BERRY",
        "typePregenArgs": [
          10
        ]
      },
      {
        "args": [
          1736079567,
          16,
          20
        ],
        "className": "AttackTypeBoosterModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "ATTACK_TYPE_BOOSTER",
        "typePregenArgs": [
          16
        ]
      },
      {
        "args": [
          1736079567,
          10
        ],
        "className": "BerryModifier",
        "player": true,
        "stackCount": 2,
        "typeId": "BERRY",
        "typePregenArgs": [
          10
        ]
      },
      {
        "args": [
          1736079567,
          8
        ],
        "className": "BerryModifier",
        "player": true,
        "stackCount": 3,
        "typeId": "BERRY",
        "typePregenArgs": [
          8
        ]
      },
      {
        "args": [
          1736079567,
          0,
          20
        ],
        "className": "AttackTypeBoosterModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "ATTACK_TYPE_BOOSTER",
        "typePregenArgs": [
          0
        ]
      },
      {
        "args": [
          1736079567,
          2
        ],
        "className": "BerryModifier",
        "player": true,
        "stackCount": 2,
        "typeId": "BERRY",
        "typePregenArgs": [
          2
        ]
      },
      {
        "args": [
          275408260
        ],
        "className": "PokemonInstantReviveModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "REVIVER_SEED"
      },
      {
        "args": [
          275408260
        ],
        "className": "PokemonNatureWeightModifier",
        "player": true,
        "stackCount": 10,
        "typeId": "SOUL_DEW"
      },
      {
        "args": [
          275408260
        ],
        "className": "PokemonMultiHitModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "MULTI_LENS"
      },
      {
        "args": [
          275408260
        ],
        "className": "SurviveDamageModifier",
        "player": true,
        "stackCount": 5,
        "typeId": "FOCUS_BAND"
      },
      {
        "args": [
          275408260
        ],
        "className": "TurnHealModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "LEFTOVERS"
      },
      {
        "args": [
          275408260
        ],
        "className": "PokemonIncrementingStatModifier",
        "player": true,
        "stackCount": 4,
        "typeId": "MYSTERY_ENCOUNTER_MACHO_BRACE"
      },
      {
        "args": [
          275408260,
          0
        ],
        "className": "BaseStatModifier",
        "player": true,
        "stackCount": 31,
        "typeId": "BASE_STAT_BOOSTER",
        "typePregenArgs": [
          0
        ]
      },
      {
        "args": [
          275408260
        ],
        "className": "PokemonBaseStatFlatModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "MYSTERY_ENCOUNTER_OLD_GATEAU"
      },
      {
        "args": [
          275408260
        ],
        "className": "TurnHeldItemTransferModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "MINI_BLACK_HOLE"
      },
      {
        "args": [
          275408260,
          10
        ],
        "className": "ContactHeldItemTransferChanceModifier",
        "player": true,
        "stackCount": 5,
        "typeId": "GRIP_CLAW"
      },
      {
        "args": [
          1079846758,
          10
        ],
        "className": "ContactHeldItemTransferChanceModifier",
        "player": true,
        "stackCount": 5,
        "typeId": "GRIP_CLAW"
      },
      {
        "args": [
          275408260,
          0
        ],
        "className": "BerryModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "BERRY",
        "typePregenArgs": [
          0
        ]
      },
      {
        "args": [
          275408260,
          2
        ],
        "className": "BerryModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "BERRY",
        "typePregenArgs": [
          2
        ]
      },
      {
        "args": [
          275408260,
          7
        ],
        "className": "BerryModifier",
        "player": true,
        "stackCount": 1,
        "typeId": "BERRY",
        "typePregenArgs": [
          7
        ]
      },
      {
        "args": [
          1079846758,
          1
        ],
        "className": "BerryModifier",
        "player": true,
        "stackCount": 2,
        "typeId": "BERRY",
        "typePregenArgs": [
          1
        ]
      }
    ]
  };

  if (!Number.isInteger(TARGET_SLOT) || TARGET_SLOT < 0 || TARGET_SLOT > 4) {
    throw new Error("TARGET_SLOT 必须是 0 到 4 的整数。");
  }

  const loadCryptoJS = async () => {
    if (window.CryptoJS?.AES) {
      return window.CryptoJS;
    }

    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js";
      script.onload = resolve;
      script.onerror = () => reject(new Error("AES 解密库加载失败，请检查网络或内容拦截设置。"));
      document.head.appendChild(script);
    });

    if (!window.CryptoJS?.AES) {
      throw new Error("AES 解密库没有成功初始化。");
    }
    return window.CryptoJS;
  };

  const cryptoJS = await loadCryptoJS();
  const encryptedSystem = localStorage.getItem(SYSTEM_KEY);
  if (!encryptedSystem) {
    throw new Error(`本地找不到 ${SYSTEM_KEY}。请先在当前浏览器登录 naoshimian 账号并载入其存档。`);
  }

  const systemText = cryptoJS.AES.decrypt(encryptedSystem, SAVE_KEY).toString(cryptoJS.enc.Utf8);
  if (!systemText) {
    throw new Error(`${SYSTEM_KEY} 解密失败。为避免上传到错误账号，已中止。`);
  }
  const systemData = JSON.parse(systemText);
  if (!Number.isInteger(systemData.trainerId) || !Number.isInteger(systemData.secretId)) {
    throw new Error(`${SYSTEM_KEY} 缺少有效 trainerId / secretId。`);
  }

  const sourceData = EMBEDDED_SOURCE;
  if (!Array.isArray(sourceData.pokemon) || !Array.isArray(sourceData.modifiers)) {
    throw new Error("脚本内嵌的宝可梦数据格式无效。");
  }

  const templates = [
    { species: 890, name: "无极汰那", expAt100: 1_250_000 },
    { species: 798, name: "纸御剑", expAt100: 1_250_000 },
    { species: 386, name: "代欧奇希斯", expAt100: 1_250_000 },
  ].map(({ species, name, expAt100 }) => {
    const pokemon = sourceData.pokemon.find(mon => mon.species === species);
    if (!pokemon || !Number.isInteger(pokemon.id) || !Array.isArray(pokemon.ivs) || !Array.isArray(pokemon.moveset)) {
      throw new Error(`脚本内嵌数据中找不到有效的${name}模板（物种 ID ${species}）。`);
    }
    return { name, expAt100, pokemon };
  });

  const markerKey = `${SCRIPT_MARKER}:${TARGET_USERNAME}:${TARGET_SLOT}`;
  const alreadyImported = Boolean(localStorage.getItem(markerKey));

  let capturedSessionId = "";
  let capturedToken = "";
  let capturedVersion = "";
  let capturedSlot = null;
  const originalFetch = window.fetch;
  const getHeader = (request, options, name) => {
    try {
      const mergedHeaders = new Headers(request?.headers);
      new Headers(options?.headers).forEach((value, key) => mergedHeaders.set(key, value));
      return mergedHeaders.get(name) ?? "";
    } catch {
      return "";
    }
  };

  window.fetch = function (...args) {
    try {
      const request = args[0];
      const requestUrl = typeof request === "string" ? request : request?.url;
      const url = new URL(requestUrl, window.location.href);
      const options = args[1] ?? {};

      if (url.origin === new URL(API_BASE).origin) {
        const slot = url.searchParams.get("slot");

        if (slot !== null) {
          capturedSlot = Number(slot);
        }

        capturedSessionId ||= url.searchParams.get("clientSessionId") ?? "";
        capturedToken ||= getHeader(request, options, "Authorization");
        capturedVersion ||= getHeader(request, options, "PKR-Client-Version");
      }
    } catch {
      // Do not interfere with the game's own request if its shape is unusual.
    }
    return originalFetch.apply(this, args);
  };

  const waitForCredentials = async () => {
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      if (capturedSessionId && capturedToken && capturedVersion) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error("60 秒内没有捕获到 API 会话信息。请重试，并在提示后点击游戏内按钮触发网络请求。");
  };

  const headers = () => ({
    Authorization: capturedToken,
    "PKR-Client-Version": capturedVersion,
    "Content-Type": "application/json",
  });

  try {
    console.log(`正在准备导入到 ${TARGET_USERNAME} 的槽位 ${TARGET_SLOT}。`);
    console.log("请在游戏内点击任意按钮触发一次网络请求，以便脚本读取本页已有的 API 会话信息。");
    await waitForCredentials();
    if (capturedSlot !== null && capturedSlot !== TARGET_SLOT) {
      console.warn(
        `当前捕获的是槽位 ${capturedSlot}，脚本目标槽位 ${TARGET_SLOT}，自动切换。`
      );
    }
    const params = new URLSearchParams({
      slot: String(TARGET_SLOT),
      clientSessionId: capturedSessionId,
    });
    const getResponse = await originalFetch(
      `${API_BASE}/savedata/session/get?${params}`,
      { method: "GET", headers: headers() },
    );
    const remoteText = await getResponse.text();
    if (!getResponse.ok || !remoteText || remoteText.trim() === "save does not exist") {
      throw new Error(`无法读取槽位 ${TARGET_SLOT}（HTTP ${getResponse.status}）：${remoteText || "(空响应)"}`);
    }

    let targetSave = JSON.parse(remoteText);

    // 兼容新版/旧版 Session 格式
    if (targetSave.sessionData) {
      targetSave = targetSave.sessionData;
    }

    if (targetSave.data) {
      targetSave = targetSave.data;
    }

    if (
      !Array.isArray(targetSave.party) ||
      (targetSave.modifiers != null && !Array.isArray(targetSave.modifiers))
    ) {
      console.error("服务器返回的 Session 结构无效:", {
        hasPartyArray: Array.isArray(targetSave.party),
        modifiersType: targetSave.modifiers === null ? "null" : typeof targetSave.modifiers,
      });
      throw new Error(
        `槽位 ${TARGET_SLOT} 返回的 Session 数据结构无效，请检查控制台输出。`
      );
    }
    if (targetSave.modifiers == null) {
      targetSave.modifiers = [];
    }
    if (!alreadyImported && targetSave.party.length + templates.length > MAX_PARTY_SIZE) {
      throw new Error(
        `槽位 ${TARGET_SLOT} 当前队伍有 ${targetSave.party.length} 只；要加入三只请先腾出至少 ${targetSave.party.length + templates.length - MAX_PARTY_SIZE} 个位置。服务器存档未修改。`,
      );
    }

    const usedIds = new Set([
      ...targetSave.party.map(mon => mon.id),
      ...targetSave.modifiers.flatMap(modifier =>
        Array.isArray(modifier.args) ? modifier.args.filter(Number.isInteger) : [],
      ),
    ]);
    const nextId = () => {
      const buffer = new Uint32Array(1);
      let id;
      do {
        crypto.getRandomValues(buffer);
        id = buffer[0];
      } while (usedIds.has(id));
      usedIds.add(id);
      return id;
    };
    const cloneJson = value => JSON.parse(JSON.stringify(value));
    const addedPokemon = [];
    const addedModifiers = [];
    const addedGlobalModifiers = [
      {
        player: true,
        typeId: "BERRY_POUCH",
        args: null,
        stackCount: 1,
        className: "PreserveBerryModifier",
      },
      {
        player: true,
        typeId: "TERA_ORB",
        args: null,
        stackCount: 1,
        className: "TerastallizeAccessModifier",
      },
      {
        player: true,
        typeId: "SHINY_CHARM",
        args: null,
        stackCount: 4,
        className: "ShinyRateBoosterModifier",
      },
      {
        player: true,
        typeId: "CATCHING_CHARM",
        args: null,
        stackCount: 3,
        className: "CriticalCatchChanceBoosterModifier",
      },
      {
        player: true,
        typeId: "LOCK_CAPSULE",
        args: null,
        stackCount: 1,
        className: "LockModifierTiersModifier",
      },
    ];

    if (!alreadyImported) for (const { name, expAt100, pokemon: source } of templates) {
      const pokemon = cloneJson(source);
      const sourceId = source.id;
      pokemon.id = nextId();
      pokemon.level = 100;
      pokemon.exp = expAt100;
      pokemon.levelExp = 0;
      pokemon.hp = Number.MAX_SAFE_INTEGER;
      pokemon.summonData = {
        ...(pokemon.summonData ?? {}),
        abilitySuppressed: false,
        hitCount: 0,
        statStages: [0, 0, 0, 0, 0, 0, 0],
        stats: [0, 0, 0, 0, 0, 0],
        tags: null,
        types: null,
      };
      addedPokemon.push({ name, pokemon });

      for (const modifier of sourceData.modifiers) {
        if (modifier.player === true && Array.isArray(modifier.args) && modifier.args[0] === sourceId) {
          const item = cloneJson(modifier);
          item.args[0] = pokemon.id;
          addedModifiers.push(item);
        }
      }
    }

    const updatedSave = cloneJson(targetSave);
    updatedSave.trainerId = systemData.trainerId;
    updatedSave.secretId = systemData.secretId;
    updatedSave.party.push(...addedPokemon.map(entry => entry.pokemon));
    updatedSave.modifiers.push(...addedModifiers);
    if (alreadyImported) {
      for (const { typeId } of addedGlobalModifiers) {
        const existing = updatedSave.modifiers.filter(modifier => modifier.typeId === typeId);
        const expected = addedGlobalModifiers.find(modifier => modifier.typeId === typeId);
        if (existing.length > 0) {
          for (const modifier of existing) {
            modifier.className = expected.className;
            modifier.args = null;
            delete modifier.typePregenArgs;
          }
        } else {
          updatedSave.modifiers.push(cloneJson(expected));
        }
      }
    } else {
      updatedSave.modifiers.push(...cloneJson(addedGlobalModifiers));
    }
    updatedSave.timestamp = Date.now();

    const backupBlob = new Blob([remoteText], { type: "application/json" });
    const backupUrl = URL.createObjectURL(backupBlob);
    const backupLink = document.createElement("a");
    backupLink.href = backupUrl;
    backupLink.download = `sessionData_slot${TARGET_SLOT}_before_import.json`;
    document.body.appendChild(backupLink);
    backupLink.click();
    backupLink.remove();
    URL.revokeObjectURL(backupUrl);

    const updateParams = new URLSearchParams({
      slot: String(TARGET_SLOT),
      trainerId: String(systemData.trainerId),
      secretId: String(systemData.secretId),
      clientSessionId: capturedSessionId,
    });
    const updateResponse = await originalFetch(
      `${API_BASE}/savedata/session/update?${updateParams}`,
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(updatedSave),
      },
    );
    const updateText = await updateResponse.text();
    if (!updateResponse.ok || updateText.trim()) {
      throw new Error(
        `上传失败（HTTP ${updateResponse.status}）：${updateText || "(空响应)"}`,
      );
    }

    localStorage.setItem(
      sessionStorageKey,
      cryptoJS.AES.encrypt(JSON.stringify(updatedSave), SAVE_KEY).toString(),
    );
    localStorage.setItem(markerKey, JSON.stringify({ timestamp: updatedSave.timestamp }));

    console.table(addedPokemon.map(({ name, pokemon }) => ({
      宝可梦: name,
      等级: pokemon.level,
      融合物种ID: pokemon.fusionSpecies,
      闪光: pokemon.shiny,
      融合闪光: pokemon.fusionShiny,
      复制的携带道具数: addedModifiers.filter(modifier => modifier.args?.[0] === pokemon.id).length,
      新ID: pokemon.id,
    })));
    console.table(addedGlobalModifiers.map(({ typeId, stackCount }) => ({
      全局道具: typeId,
      数量: stackCount,
    })));
    console.log(`槽位 ${TARGET_SLOT} 上传成功。刷新页面后从该槽位继续游戏。`);
    if (alreadyImported) {
      console.log("检测到该槽位曾运行过旧版脚本；本次仅修复树果袋和太晶珠，没有再次克隆宝可梦。");
    }
    console.log("上传前的槽位备份已下载为 sessionData_slot" + TARGET_SLOT + "_before_import.json");
  } finally {
    window.fetch = originalFetch;
  }
})()
