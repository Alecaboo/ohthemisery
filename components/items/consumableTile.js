import styles from '../../styles/Items.module.css';
import ConsumableFormatter from '../../utils/items/consumableFormatter';
import TranslatableText from '../translatableText';
import React from 'react';

const MAX_FISH_QUALITY = 5;

function camelCase(str) {
    if (!str) return "";
    return str.replaceAll('\'', '').replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
        return index == 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
}

function getItemType(item) {
    if (item.type != undefined) {
        return camelCase(item.type);
    }
    return "misc";
}

function getItemsheetClass(itemName) {
    return `monumenta-${itemName.replace(/\(.*\)/g, '').replaceAll(" ", "-").replaceAll("_", "-").replaceAll("'", "").trim()}`;
}

function doesStyleExist(className) {
    try {
        let styleSheets = document.styleSheets;
        let styleSheetsLength = styleSheets.length;
        for (let i = 0; i < styleSheetsLength; i++){
            let classes = styleSheets[i].cssRules;
            if (!classes) {
                continue;
            }
            
            for (let x = 0; x < classes.length; x++) {
                if (classes[x].selectorText == `.${className}`) {
                    return true;
                }
            }
        }
    } catch (e) {
        return false;
    }
    return false;
}

function getFishQualityElement(fishQuality) {
    return <span><span>Fish Quality : </span><span className={styles[`fish${fishQuality}`]}>{"★".repeat(fishQuality) + "☆".repeat(MAX_FISH_QUALITY - fishQuality)}</span></span>
}

export default function ConsumableTile(data) {
    const item = data.item
    let formattedEffects = ConsumableFormatter.formatEffects(item.effects);

    const [cssClass, setCssClass] = React.useState(getItemsheetClass(item.name));
    const [baseBackgroundClass, setBaseBackgroundClass] = React.useState("monumenta-items");

    React.useEffect(() => {
        if (!doesStyleExist(getItemsheetClass(item.name))) {
            // The consumable doesn't have its own texture on the spritesheet, and must be defaulted to a minecraft texture.
            setBaseBackgroundClass("minecraft");
            setCssClass(`minecraft-${item['base_item'].replaceAll(" ", "-").replaceAll("_", "-").toLowerCase()}`);
        } else {
            setBaseBackgroundClass("monumenta-items");
            setCssClass(getItemsheetClass(item.name));
        }
    }, [item]);

    return (
        <div className={`${styles.itemTile} ${data.hidden ? styles.hidden : ""}`}>
            <div className={styles.imageIcon}>
                <div className={[baseBackgroundClass, cssClass].join(" ")}></div>
            </div>
            <span className={`${styles[camelCase(item.location)]} ${styles[camelCase(item.tier)]} ${styles.name}`}>
                <a href={`https://monumenta.wiki.gg/wiki/${item.name.replace(/\(.*\)/g, '').trim().replaceAll(" ", "_",)}`} target="_blank" rel="noreferrer" className={item.fish_quality == 5 ? styles["underline"] : ""}>{item.name}</a>
            </span>
            {
                (item.fish_quality) ? getFishQualityElement(item.fish_quality) : ""
            }
            <span className={styles.infoText}><TranslatableText identifier={`items.type.${getItemType(item)}`}></TranslatableText>{` - ${item['base_item']} `}</span>
            {item['original_item'] ? <span className={styles.infoText}>{`Skin for ${item['original_item']} `}</span> : ""}
            <span>
                <span className={styles.infoText}>{`${(item.region) ? item.region : ""} `}</span>
                <span className={styles[camelCase(item.tier)]}>{(item.tier) ? item.tier : "Consumable"}</span>
            </span>
            <span className={styles[camelCase(item.location)]}>{item.location}</span>
            {formattedEffects}
            {item.lore ? <span className={styles.infoText}>{item.lore}</span> : ""}
            {item.extras?.poi ? <p className={`${styles.infoText} m-0`}>{`Found in ${item.extras.poi}`}</p> : ""}
            {item.extras?.notes ? <p className={`${styles.infoText} m-0`}>{item.extras.notes}</p> : ""}
        </div>
    )
}