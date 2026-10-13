// Run once in the browser console on a locally served Vite development build.
// Do not run on pokerogue.net; the source-module imports are unavailable there.
(async () => {
  const [{ globalScene }, { getLevelTotalExp }, { PokemonMove }, { PokemonHeldItemModifier }] = await Promise.all([
    import("/src/globals/global-scene.ts"),
    import("/src/data/exp.ts"),
    import("/src/data/moves/pokemon-move.ts"),
    import("/src/modifier/modifier.ts"),
  ]);

  const scene = globalScene;
  const party = scene.getPlayerParty();
  const templates = [
    { id: 497, name: "君主蛇" },
    { id: 798, name: "纸御剑" },
  ].map(({ id, name }) => {
    const pokemon = party.find(p => p.species.speciesId === id);
    if (!pokemon) {
      throw new Error(`队伍里找不到${name}模板，请先加载包含它的存档`);
    }
    return { name, pokemon };
  });

  if (party.length + templates.length > 6) {
    throw new Error(`队伍最多6只；当前${party.length}只。请先腾出${party.length + templates.length - 6}个空位。没有更改队伍。`);
  }

  const usedIds = new Set(party.map(p => p.id));
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

  const added = [];
  for (const { name, pokemon: source } of templates) {
    const heldItems = scene
      .findModifiers(m => m instanceof PokemonHeldItemModifier && m.pokemonId === source.id)
      .map(modifier => modifier.clone());

    const pokemon = scene.addPlayerPokemon(
      source.species,
      100,
      source.abilityIndex,
      source.formIndex,
      source.gender,
      source.shiny,
      source.variant,
      [...source.ivs],
      source.nature,
      source,
    );

    pokemon.id = nextId();
    pokemon.level = 100;
    pokemon.exp = getLevelTotalExp(100, pokemon.species.growthRate);
    pokemon.stats = [...source.stats];
    pokemon.ivs = [...source.ivs];
    pokemon.moveset = source.moveset.map(move => PokemonMove.loadMove(move));
    pokemon.usedTMs = [...(source.usedTMs ?? [])];
    pokemon.customPokemonData = {
      ...source.customPokemonData,
      types: Array.isArray(source.customPokemonData?.types)
        ? [...source.customPokemonData.types]
        : source.customPokemonData?.types,
    };
    pokemon.fusionCustomPokemonData = source.fusionCustomPokemonData
      ? {
          ...source.fusionCustomPokemonData,
          types: Array.isArray(source.fusionCustomPokemonData.types)
            ? [...source.fusionCustomPokemonData.types]
            : source.fusionCustomPokemonData.types,
        }
      : null;
    pokemon.calculateStats();
    pokemon.hp = pokemon.getMaxHp();
    party.push(pokemon);

    for (const item of heldItems) {
      item.pokemonId = pokemon.id;
      if (!scene.addModifier(item, true, false, false, true)) {
        throw new Error(`复制${name}的携带道具失败`);
      }
    }

    await pokemon.loadAssets();
    await pokemon.updateInfo(true);
    added.push({
      name,
      level: pokemon.level,
      fusionSpeciesId: pokemon.fusionSpecies?.speciesId ?? 0,
      copiedHeldItemCount: heldItems.length,
      id: pokemon.id,
    });
  }

  scene.updateModifiers(true, true);
  scene.updateUIPositions();
  console.table(added);
  return added;
})()
