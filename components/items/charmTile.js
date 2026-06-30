import styles from '../../styles/Items.module.css'
import CharmFormatter from '../../utils/items/charmFormatter'
import TranslatableText from '../translatableText';
import React from 'react';

function camelCase(str) {
    if (!str) return "";
    return str.replaceAll('\'', '').replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
        return index == 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
}

function makePowerString(power) {
    return <span>Charm Power: <span className={styles.masterworkStar}>{"★".repeat(power)}</span></span>;
}

function makeClassString(className) {
    return <span className={styles[className.toLowerCase()]}>{className}</span>
}

function getImageName(charmTier, charmClass, charmPower) {
    if (charmTier == "Epic") {
        return `Epic-Charm-${charmPower}`;
    }
    return `${(charmClass == "Alchemist") ? "Alch" : (charmClass == "Generalist") ? "Gen" : charmClass}-Charm${(charmTier == "Base") ? "" : `-${charmTier}`}-${charmPower}`;
}

function getCharmSheetClass(charmName) {
    return `monumenta-${charmName.replaceAll(" ", "-").replaceAll("_", "-").replaceAll("'", "").trim()}`
}

function doesStyleExist(className) {
    let styleSheets;
    try {
        styleSheets = document.styleSheets;
    } catch (e) {
        return false;
    }

    for (let i = 0; i < styleSheets.length; i++) {
        let rules;
        try {
            rules = styleSheets[i].cssRules;
        } catch (e) {
            // Cross-origin stylesheets (e.g., CDN bootstrap) throw on cssRules.
            continue;
        }

        if (!rules) {
            continue;
        }

        for (let x = 0; x < rules.length; x++) {
            if (rules[x].selectorText == `.${className}`) {
                return true;
            }
        }
    }
    return false;
}

export default function CharmTile(data) {
    const item = data.item;
    const [cssClass, setCssClass] = React.useState(getCharmSheetClass(item.name));
    
    let formattedCharm = CharmFormatter.formatCharm(item.stats);

    React.useEffect(() => {
        if (!doesStyleExist(getCharmSheetClass(item.name))) {
            // The charm doesn't have its own texture on the spritesheet, and must be defaulted to the default charms.
            setCssClass(`monumenta-${getImageName(item.tier, item.class_name, item.power)}`);
        } else {
            setCssClass(getCharmSheetClass(item.name));
        }
    }, [item.name, item.tier, item.class_name, item.power]);

    return (
        <div className={`${styles.itemTile} ${data.hidden ? styles.hidden : ""}`}>
            <div className={styles.imageIcon}>
                <div className={["monumenta-charms", cssClass].join(" ")}></div>
            </div>
            <span className={`${styles[camelCase(item.location)]} ${styles[camelCase(item.tier)]} ${styles.name}`}>
                <a href={`https://monumenta.wiki.gg/wiki/${item.name.replace(/\(.*\)/g, '').trim().replaceAll(" ", "_",)}`} target="_blank" rel="noreferrer">{item.name}</a>
            </span>
            <span className={styles.infoText}><TranslatableText identifier="items.type.charm"></TranslatableText>{` - ${item['base_item']} `}</span>
            {item['original_item'] ? <span className={styles.infoText}>{`Skin for ${item['original_item']} `}</span> : ""}
            <span className={styles.infoText}>{makePowerString(item.power)} - {makeClassString(item.class_name)}</span>
            {formattedCharm}
            <span>
                <span className={styles.infoText}>{`${item.region} `}</span>
                <span className={styles[camelCase(item.tier)]}>{(item.tier != "Base") ? `${item.tier} ` : ""}Charm</span>
            </span>
            <span className={styles[camelCase(item.location)]}>{item.location}</span>
            {item.extras?.poi ? <p className={`${styles.infoText} m-0`}>{`Found in ${item.extras.poi}`}</p> : ""}
            {item.extras?.notes ? <p className={`${styles.infoText} m-0`}>{`${item.extras.notes}`}</p> : ""}
        </div>
    )
}