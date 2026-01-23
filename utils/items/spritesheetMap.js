let spriteMapPromise;
let spriteMapCache;

export function loadItemSpriteMap() {
    if (spriteMapCache) {
        return Promise.resolve(spriteMapCache);
    }
    if (!spriteMapPromise) {
        spriteMapPromise = fetch('/spritesheets/itemsheet-map.json')
            .then((response) => (response.ok ? response.json() : {}))
            .catch(() => ({}))
            .then((map) => {
                spriteMapCache = map || {};
                return spriteMapCache;
            });
    }
    return spriteMapPromise;
}

export function getMappedSpriteClass(map, itemName) {
    if (!map || !itemName) {
        return null;
    }
    const mapped = map[itemName];
    return mapped ? `monumenta-${mapped}` : null;
}
