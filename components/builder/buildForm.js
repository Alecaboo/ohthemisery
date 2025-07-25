import Select from 'react-select';
import SelectInput from '../items/selectInput';
import CheckboxWithLabel from '../items/checkboxWithLabel';
import ItemTile from '../items/itemTile';
import MasterworkableItemTile from '../items/masterworkableItemTile';
import styles from '../../styles/Items.module.css'
import React from 'react';
import { useRouter } from 'next/router';

import Stats from '../../utils/builder/stats';
import TranslatableText from '../translatableText';
import ListSelector from './listSelector';
import CharmSelector from './charmSelector';
import CharmShortener from '../../utils/builder/charmShortener';

const emptyBuild = { mainhand: "None", offhand: "None", helmet: "None", chestplate: "None", leggings: "None", boots: "None" };

const enabledBoxes = {
    // Situational Defense
    shielding: false,
    poise: false,
    inure: false,
    steadfast: false,
    guard: false,
    second_wind: false,
    ethereal: false,
    reflexes: false,
    evasion: false,
    tempo: false,
    cloaked: false,
    earth_aspect: false,

    // Situational Damage
    smite: false,
    duelist: false,
    slayer: false,
    point_blank: false,
    sniper: false,
    first_strike: false,
    regicide: false,
    trivium: false,
    stamina: false,
    technique: false,
    abyssal: false,
    fractal: false,
    retaliation_normal: false,
    retaliation_elite: false,
    retaliation_boss: false
};

const situationalDefenses = [
    "shielding",
    "poise",
    "inure",
    "steadfast",
    "guard",
    "second_wind",
    "ethereal",
    "reflexes",
    "evasion",
    "tempo",
    "cloaked",
    "earth_aspect"
]

const situationalFlatDamage = [
    "smite",
    "duelist",
    "slayer",
    "point_blank",
    "sniper"
]

const situationalPercentDamage = [
    "first_strike",
    "regicide",
    "trivium",
    "stamina",
    "technique",
    "abyssal",
    "fractal",
    "retaliation_normal",
    "retaliation_elite",
    "retaliation_boss"
]

const extraStats = {
    damageMultipliers: [],
    resistanceMultipliers: [],
    healthMultipliers: [],
    speedMultipliers: [],
    attackSpeedMultipliers: []
}

const itemTypes = [
    "mainhand", 
    "offhand", 
    "helmet", 
    "chestplate", 
    "leggings", 
    "boots"
];

const regions = [
    { value: 1, label: "Valley" },
    { value: 2, label: "Isles" },
    { value: 3, label: "Ring" }
]

const classes = [
  "Alchemist",
  "Cleric",
  "Mage",
  "Rogue",
  "Scout",
  "Shaman",
  "Warlock",
  "Warrior"
]

const classAbilityBuffs = {
    "none": [], // placeholder to avoid undefineds
    "alchemist": ["Taboo Lv1", "Taboo Lv2", "Taboo Burst"],
    "cleric": ["Celestial Blessing Lv1", "Celestial Blessing Lv2"],
    "mage": ["Channeling"],
    "rogue": ["Dethroner (Elite)", "Dethroner (Boss)"],
    "scout": [".Versatile"],
    "shaman": ["Totemic Empowerment"],
    "warlock": ["Culling"],
    "warrior": [".Formidable", "Weapon Mastery Lv1", "Weapon Mastery Lv2", "Weapon Mastery Enhancement"]
};

const enabledClassAbilityBuffs = {
    versatile: false,
    weapon_mastery: false,
    weapon_mastery_lv1: false,
    weapon_mastery_lv2: false,
    weapon_mastery_enhancement: false,
    formidable: false,
    dethroner_elite: false,
    dethroner_boss: false,
    culling: false,
    totemic_empowerment: false,
    taboo_lv1: false,
    taboo_lv2: false,
    taboo_burst: false,
    channeling: false,
    celestial_blessing_lv1: false,
    celestial_blessing_lv2: false
}

function groupMasterwork(items, itemData) {
    // Group up masterwork tiers by their name using an object, removing them from items.
    let masterworkItems = {};
    // Go through the array in reverse order to have the splice work properly
    // (items will go down in position if not removed from the end)
    for (let i = items.length - 1; i >= 0; i--) {
        let name = items[i];
        if (itemData[name].masterwork != undefined) {
            let itemName = itemData[name].name;
            if (!masterworkItems[itemName]) {
                masterworkItems[itemName] = [];
            }
            masterworkItems[itemName].push(itemData[name]);
            items.splice(i, 1);
        }
    }

    // Re-insert the groups as arrays into the items array.
    Object.keys(masterworkItems).forEach(item => {
        items.push({ value: `${item}-${masterworkItems[item][0].masterwork}`, label: item });
    });

    return items;
}

function getRelevantItems(types, itemData) {
    let items = Object.keys(itemData);
    return groupMasterwork(items.filter(name => types.includes(itemData[name].type.toLowerCase().replace(/<.*>/, "").trim())), itemData);
}

function recalcBuild(data, itemData) {
    let tempStats = new Stats(itemData, data, enabledBoxes, extraStats, enabledClassAbilityBuffs);
    return tempStats;
}

function createMasterworkData(name, itemData) {
    return Object.keys(itemData).filter(itemName => itemData[itemName].name == name).map(itemName => itemData[itemName]);
}

function removeMasterworkFromName(name) {
    return name.replace(/-\d$/g, "");
}

function checkExists(type, itemsToDisplay, itemData) {
    let retVal = false;
    if (itemsToDisplay.itemStats) {
        retVal = itemsToDisplay.itemStats[type] !== undefined;
    }
    if (itemsToDisplay.itemNames && itemsToDisplay.itemNames[type] && createMasterworkData(removeMasterworkFromName(itemsToDisplay.itemNames[type]), itemData)[0]?.masterwork != undefined) {
        retVal = true;
    }
    return retVal;
}

function formatSituationalName(situ) {
    let ret = situ.split("_").map(word => word[0].toUpperCase() + word.substring(1)).join(" ");
    if(ret.match("Retaliation")) return ret.split(" ")[0] + " (" + ret.split(" ")[1].toLowerCase() + ")";
    return ret;
}

function unformatBuffName(buff) {
    return buff.replace(/[.()]/,"").replace(" ","_").toLowerCase();
}

function generateSituationalCheckboxes(itemsToDisplay, checkboxChanged){
    let tempDef = [];
    let tempFlatDmg = [];
    let tempPercentDmg = [];

    situationalDefenses.forEach(function(situ) { 
        if(!itemsToDisplay.situationals) return;
        if(itemsToDisplay.situationals[situ].level) { 
            tempDef.push(<CheckboxWithLabel key={"situationalbox-"+situ} name={formatSituationalName(situ)} checked={enabledBoxes[situ]} onChange={checkboxChanged} />);
        }
    });
    situationalFlatDamage.forEach(function(situ) { 
        if(!itemsToDisplay.situationals) return;
        if(itemsToDisplay.situationals[situ].level) { 
            tempFlatDmg.push(<CheckboxWithLabel key={"situationalbox-"+situ} name={formatSituationalName(situ)} checked={enabledBoxes[situ]} onChange={checkboxChanged} />);
        }
    });
    situationalPercentDamage.forEach(function(situ) { 
        if(!itemsToDisplay.situationals) return;
        if(itemsToDisplay.situationals[situ].level) { 
            tempPercentDmg.push(<CheckboxWithLabel key={"situationalbox-"+situ} name={formatSituationalName(situ)} checked={enabledBoxes[situ]} onChange={checkboxChanged} />);
        }
    });
    if(itemsToDisplay.retaliation) {
        ["normal", "elite", "boss"].forEach(type => {
            tempPercentDmg.push(<CheckboxWithLabel key={"situationalbox-retaliation_"+type} name={formatSituationalName("retaliation_"+type)} checked={enabledBoxes["retaliation_"+type]} onChange={checkboxChanged} />);
        })
    }
    /* if(itemsToDisplay.meleeDamagePercent > 100 || itemsToDisplay.projectileDamagePercent > 100){
        tempPercentDmg.push(<CheckboxWithLabel key={"situationalbox-versatile"} name="Versatile" checked={false} onChange={checkboxChanged} />)
    } */

    let temp = [];
    temp.push(...tempDef);
    if(tempDef.length > 0 && tempFlatDmg.length > 0){
        temp.push(<span key="spacer1" style={{width: "10px", padding: "0px"}}></span>);
        // spacer between def and flat damage if both exist
    }
    temp.push(...tempFlatDmg);
    if(temp.length > 0 && tempPercentDmg.length > 0){
        temp.push(<span key="spacer2" style={{width: "10px", padding: "0px"}}></span>);
        // spacer between existing stuff and percent damage if both exist
    }
    temp.push(...tempPercentDmg);
    if(temp.length == 0){
        temp.push(<TranslatableText className={styles.noSituationals} key="builder.info.noSituationals" identifier="builder.info.noSituationals"></TranslatableText>)
    }
    return temp;
}

function generateClassAbilityBuffCheckboxes(gameClass, buffCheckboxChanged){
    let temp = [];
    let buffs = classAbilityBuffs[gameClass];
    if(!buffs) buffs = [];
    buffs.forEach(function(buff) {
        if(buff[0] == ".") { 
            temp.push(<CheckboxWithLabel disabled={true} key={"classabilitybuffbox-"+unformatBuffName(buff)} name={buff.substring(1)} checked={true} />);
        } else {
            temp.push(<CheckboxWithLabel key={"classabilitybuffbox-"+unformatBuffName(buff)} name={buff} checked={enabledClassAbilityBuffs[buff]} onChange={buffCheckboxChanged} />);
        }
    })
    if(temp.length == 0){
        temp.push(<TranslatableText className={styles.noSituationals} key="builder.info.noClassAbilityBuffs" identifier="builder.info.noClassAbilityBuffs"></TranslatableText>)
    }
    return temp;
}

export default function BuildForm({ update, build, parentLoaded, itemData, itemsToDisplay, buildName, updateLink, setUpdateLink }) {
    const [stats, setStats] = React.useState({});
    const [charms, setCharms] = React.useState([]);
    const [urlCharms, setUrlCharms] = React.useState([]);
    const [gameClass, setGameClass] = React.useState("none"); // "class" is a reserved word

    const [updateLoaded, setUpdateLoaded] = React.useState(false);

    function sendUpdate(event) {
        event.preventDefault();
        const itemNames = Object.fromEntries(new FormData(event.target).entries());
        const tempStats = recalcBuild(itemNames, itemData);
        setStats(tempStats);
        update(tempStats);
        router.push(`/builder?${makeBuildString()}`, `/builder/${makeBuildString()}`, { shallow: true });
    }

    React.useEffect(() => {
        if (parentLoaded && build) {
            let buildParts = decodeURI(build).split("&");
            let itemNames = {
                mainhand: (buildParts.find(str => str.includes("m="))?.split("m=")[1]),
                offhand: (buildParts.find(str => str.includes("o="))?.split("o=")[1]),
                helmet: (buildParts.find(str => str.includes("h="))?.split("h=")[1]),
                chestplate: (buildParts.find(str => str.includes("c="))?.split("c=")[1]),
                leggings: (buildParts.find(str => str.includes("l="))?.split("l=")[1]),
                boots: (buildParts.find(str => str.includes("b="))?.split("b=")[1])
            };
            Object.keys(itemNames).forEach(type => {
                if (itemNames[type] === undefined || !Object.keys(itemData).includes(itemNames[type])) {
                    itemNames[type] = "None";
                }
            });
            let charmString = buildParts.find(str => str.includes("charm="));
            if (charmString) {
                let charmList = CharmShortener.parseCharmData(charmString.split("charm=")[1], itemData);
                setUrlCharms(charmList);

                // dunno what happened here but i needed to change this to have the map()
                // so it's passing a list of charm objects, not charm names
                // idk why it worked before and stopped working now, but this fixes it
                setCharms(charmList.map(name => itemData[name]));
            }
            const tempStats = recalcBuild(itemNames, itemData);
            setStats(tempStats);
            update(tempStats);
            setUpdateLoaded(true);
        }
    }, [parentLoaded]);

    const formRef = React.useRef();
    const router = useRouter();
    const itemRefs = {
        mainhand: React.useRef(),
        offhand: React.useRef(),
        helmet: React.useRef(),
        chestplate: React.useRef(),
        leggings: React.useRef(),
        boots: React.useRef()
    }

    function resetForm(event) {
        for (let ref in itemRefs) {
            itemRefs[ref].current.setValue({ value: "None", label: "None" });
        }
        const tempStats = recalcBuild(emptyBuild, itemData)
        setStats(tempStats);
        update(tempStats);
        router.push('/builder', `/builder/`, { shallow: true });
    }

    function receiveMasterworkUpdate(newActiveItem, itemType) {
        let newBuild = {};
        for (let ref in itemRefs) {
            newBuild[ref] = itemRefs[ref].current.getValue()[0].value;
        }
        let mainhands = ["mainhand", "mainhand sword", "mainhand shield", "axe", "pickaxe", "wand", "scythe", "bow", "crossbow", "snowball", "trident"];
        let offhands = ["offhand", "offhand shield", "offhand sword"];
        let actualItemType = (mainhands.includes(itemType.toLowerCase())) ? "mainhand" : (offhands.includes(itemType.toLowerCase())) ? "offhand" : itemType.toLowerCase();

        const manualBuildString = encodeURI(decodeURI(makeBuildString()).replace(newBuild[actualItemType.toLowerCase()], `${newActiveItem.name}-${newActiveItem.masterwork}`));
        newBuild[actualItemType.toLowerCase()] = `${newActiveItem.name}-${newActiveItem.masterwork}`;
        itemRefs[actualItemType.toLowerCase()].current.setValue({ "value": `${newActiveItem.name}-${newActiveItem.masterwork}`, "label": newActiveItem.name });
        router.push(`/builder?${manualBuildString}`, `/builder/${manualBuildString}`, { shallow: true });

        const tempStats = recalcBuild(newBuild, itemData)
        setStats(tempStats);
        update(tempStats);
    }

    function copyBuild(event) {
        let baseUrl = `${window.location.origin}/builder/`;
        event.target.value = "Copied!";
        event.target.classList.add("fw-bold");
        setTimeout(() => { event.target.value = "Share"; event.target.classList.remove("fw-bold") }, 3000);

        if (!navigator.clipboard) {
            window.alert("Couldn't copy build to clipboard. Sadness. :(");
            return;
        }
        navigator.clipboard.writeText(`${baseUrl}${makeBuildString()}`).then(function () {
            console.log('Copying to clipboard was successful!');
        }, function (err) {
            console.error('Could not copy text: ', err);
        });
    }

    function copyBuildDiscord(event) {
        let baseUrl = `${window.location.origin}/builder/`;
        event.target.value = "Copied!";
        event.target.classList.add("fw-bold");
        setTimeout(() => { event.target.value = "Copy link for Discord"; event.target.classList.remove("fw-bold") }, 3000);
        let tempBuildName = buildName ? buildName : "Monumenta Builder"

        if (!navigator.clipboard) {
            window.alert("Couldn't copy build to clipboard. Sadness. :(");
            return;
        }
        navigator.clipboard.writeText(`[${tempBuildName}](${baseUrl}${makeBuildString()})`).then(function () {
            console.log('Copying to clipboard was successful!');
        }, function (err) {
            console.error('Could not copy text: ', err);
        });
    }

    function getEquipName(type) {
        if (!build) return undefined
        let buildParts = decodeURI(build).split("&");
        let allowedTypes = ["mainhand", "offhand", "helmet", "chestplate", "leggings", "boots"]
        let name = (allowedTypes.includes(type)) ? buildParts.find(str => str.includes(`${type[0]}=`))?.split(`${type[0]}=`)[1] : "None";
        if (!Object.keys(itemData).includes(name)) {
            return { "value": "None", "label": "None" };
        }
        return { "value": name, "label": removeMasterworkFromName(name) };
    }

    function makeBuildString(charmsOverride, dataOverride) {
        let data = (dataOverride) ? dataOverride : new FormData(formRef.current).entries();
        let buildString = "";
        let keysToShare = ["mainhand", "offhand", "helmet", "chestplate", "leggings", "boots"];
        for (const [key, value] of data) {
            buildString += (keysToShare.includes(key)) ? `${key[0]}=${value.replaceAll(" ", "%20")}&` : "";
        }

        let charmsToLookAt = (charmsOverride) ? charmsOverride : charms;

        if (charmsToLookAt.length == 0) {
            buildString += "charm=None";
        } else {
            buildString += `charm=${CharmShortener.shortenCharmList(charmsToLookAt)}`;
        }

        if(buildName != "Monumenta Builder") buildString += `&name=${encodeURIComponent(buildName)}`;

        return buildString;
    }

    function checkboxChanged(event) {
        const name = event.target.name.replace(" ","_").replace(/[()]/g,""); // replace spaces so we can still have them visually without breaking existing stuff
        enabledBoxes[name] = event.target.checked;
        let temp = event.target.checked;
        const retaliationtypes = ["retaliation_normal","retaliation_elite","retaliation_boss"];
        if(retaliationtypes.includes(name)) {
            retaliationtypes.forEach(type => {
                enabledBoxes[type] = false;
                setCheckboxChecked(event.target.form, type.split("_")[0] + " (" + type.split("_")[1] + ")", false);
            });
            enabledBoxes[name] = temp;
            event.target.checked = temp;
        }
        const itemNames = Object.fromEntries(new FormData(formRef.current).entries());
        const tempStats = recalcBuild(itemNames, itemData);
        setStats(tempStats);
        update(tempStats);
    }

    function buffCheckboxChanged(event) {
        const name = event.target.name.replace(/ /g,"_").replace(/[()]/g,""); // replace spaces so we can still have them visually without breaking existing stuff
        enabledClassAbilityBuffs[name] = event.target.checked;
        switch (name) {
            case "taboo_lv2":
                enabledClassAbilityBuffs.taboo = event.target.checked;
                enabledClassAbilityBuffs.taboo_lv1 = false;
                setCheckboxChecked(event.target.form, "taboo lv1", false);
                if (!event.target.checked) {
                    enabledClassAbilityBuffs.taboo_burst = false;
                    setCheckboxChecked(event.target.form, "taboo burst", false);
                }
                break;
            case "taboo_lv1":
                enabledClassAbilityBuffs.taboo = event.target.checked;
                enabledClassAbilityBuffs.taboo_lv2 = false;
                setCheckboxChecked(event.target.form, "taboo lv2", false);
                enabledClassAbilityBuffs.taboo_burst = false;
                setCheckboxChecked(event.target.form, "taboo burst", false);
                break;
            case "taboo_burst":
                if(event.target.checked) enabledClassAbilityBuffs.taboo = true;
                enabledClassAbilityBuffs.taboo_lv2 = true;
                setCheckboxChecked(event.target.form, "taboo lv2", true);
                enabledClassAbilityBuffs.taboo_lv1 = false;
                setCheckboxChecked(event.target.form, "taboo lv1", false);
                break;
            case "weapon_mastery_lv1":
                enabledClassAbilityBuffs.weapon_mastery = event.target.checked;
                enabledClassAbilityBuffs.weapon_mastery_lv2 = false;
                setCheckboxChecked(event.target.form, "weapon mastery lv2", false);
                if (!event.target.checked) {
                    enabledClassAbilityBuffs.weapon_mastery_enhancement = false;
                    setCheckboxChecked(event.target.form, "weapon mastery enhancement", false);
                }
                break;
            case "weapon_mastery_lv2":
                enabledClassAbilityBuffs.weapon_mastery = event.target.checked;
                enabledClassAbilityBuffs.weapon_mastery_lv1 = false;
                setCheckboxChecked(event.target.form, "weapon mastery lv1", false);
                if (!event.target.checked) {
                    enabledClassAbilityBuffs.weapon_mastery_enhancement = false;
                    setCheckboxChecked(event.target.form, "weapon mastery enhancement", false);
                }
                break;
            case "weapon_mastery_enhancement":
                if (event.target.checked && !enabledClassAbilityBuffs.weapon_mastery_lv1) {
                    enabledClassAbilityBuffs.weapon_mastery_lv2 = true;
                    setCheckboxChecked(event.target.form, "weapon mastery lv2", true);
                }
                break;
            case "celestial_blessing_lv1":
                enabledClassAbilityBuffs.celestial_blessing = event.target.checked;
                enabledClassAbilityBuffs.celestial_blessing_lv2 = false;
                setCheckboxChecked(event.target.form, "celestial blessing lv2", false);
                break;
            case "celestial_blessing_lv2":
                enabledClassAbilityBuffs.celestial_blessing = event.target.checked;
                enabledClassAbilityBuffs.celestial_blessing_lv1 = false;
                setCheckboxChecked(event.target.form, "celestial blessing lv1", false);
                break;
            default:
                break;
        }
        const itemNames = Object.fromEntries(new FormData(formRef.current).entries());
        const tempStats = recalcBuild(itemNames, itemData);
        setStats(tempStats);
        update(tempStats);
    }

    function getCheckboxRef(form, name) {
        return form[Object.keys(form).find(key => form[key].type == "checkbox" && form[key].name == name)];
    }

    function setCheckboxChecked(form, name, checked) {
        getCheckboxRef(form, name).checked = checked;
    }

    function multipliersChanged(newMultipliers, name) {
        extraStats[name] = newMultipliers;
        const itemNames = Object.fromEntries(new FormData(formRef.current).entries());
        const tempStats = recalcBuild(itemNames, itemData);
        setStats(tempStats);
        update(tempStats);
    }

    function damageMultipliersChanged(newMultipliers) {
        multipliersChanged(newMultipliers, "damageMultipliers");
    }

    function resistanceMultipliersChanged(newMultipliers) {
        multipliersChanged(newMultipliers, "resistanceMultipliers");
    }

    function healthMultipliersChanged(newMultipliers) {
        multipliersChanged(newMultipliers, "healthMultipliers");
    }

    function speedMultipliersChanged(newMultipliers) {
        multipliersChanged(newMultipliers, "speedMultipliers");
    }
    function attackSpeedMultipliersChanged(newMultipliers){
      multipliersChanged(newMultipliers,"attackSpeedMultipliers");
    }

    function updateCharms(charmNames) {
        let charmData = charmNames.map(name => itemData[name]);
        setCharms(charmData);
        router.push(`/builder?${makeBuildString(charmData)}`, `/builder/${makeBuildString(charmData)}`, { shallow: true });
    }

    function itemChanged(newValue, actionMeta) {
        // This is here so you don't have to scroll down to "Recalculate" and then back up to click a situational.
        // It updates the whole form. I don't think this was the original intent but checkboxes do anyway
        // so may as well. However, it's kind of awkward because the FormData.entries() does not yet contain
        // the new value of the item that was just changed, so we have to get it ourselves.
        // Unlike most event handler props, Select's `onChange` does not pass an event.
        // It instead passes the new value of the Select, and an "action meta" containing the checkbox name (and other stuff).
        // Why is this not condensed into an event containing both of these and a ref to the target? Beats me. -LC
        let entries = Array.from(new FormData(formRef.current).entries());
        for(let i=0;i<entries.length;i++){
            if(entries[i][0] == actionMeta.name) entries[i][1] = newValue.value;
        }
        const itemNames = Object.fromEntries(entries);
        const tempStats = recalcBuild(itemNames, itemData);
        setStats(tempStats);
        update(tempStats);
        router.push(`/builder?${makeBuildString(null, entries)}`, `/builder/${makeBuildString(null, entries)}`, { shallow: true });
    }

    function classChanged(newValue, actionMeta) {
        // no need to check actionmeta because theres only one class dropdown
        let newClass = newValue.value.toLowerCase();
        setGameClass(newClass);
        // need to set all buffs to false
        Object.keys(enabledClassAbilityBuffs).forEach(buff => enabledClassAbilityBuffs[buff] = false);
        // enable all always-on buffs for this class
        classAbilityBuffs[newClass].forEach(buff => {
            if(buff[0] == ".") {
                enabledClassAbilityBuffs[unformatBuffName(buff)] = true;
            }
        })
        // and then recalculate... zzz
        const itemNames = Object.fromEntries(new FormData(formRef.current).entries());
        const tempStats = recalcBuild(itemNames, itemData);
        setStats(tempStats);
        update(tempStats);
    }

    if(updateLink){
        // awkward signal thing to update the link from the builderheader to get the name properly fixed up
        // don't need to worry about updating the build string since it auto updates on dropdown change now
        router.push(`/builder?${makeBuildString()}`, `/builder/${makeBuildString()}`, { shallow: true });
        setUpdateLink(false);
    }

    return (
        <form ref={formRef} onSubmit={sendUpdate} onReset={resetForm} id="buildForm">
            <div className="row justify-content-center mb-3">
                <div className="col-12 col-md-5 col-lg-2 text-center">
                    <TranslatableText identifier="items.type.mainhand"></TranslatableText>
                    <SelectInput reference={itemRefs.mainhand} name="mainhand" default={getEquipName("mainhand")} noneOption={true} sortableStats={getRelevantItems(["mainhand", "mainhand sword", "mainhand shield", "axe", "pickaxe", "wand", "scythe", "bow", "crossbow", "snowball", "trident"], itemData)} onChange={itemChanged}></SelectInput>
                </div>
                <div className="col-12 col-md-5 col-lg-2 text-center">
                    <TranslatableText identifier="items.type.offhand"></TranslatableText>
                    <SelectInput reference={itemRefs.offhand} name="offhand" default={getEquipName("offhand")} noneOption={true} sortableStats={getRelevantItems(["offhand", "offhand shield", "offhand sword"], itemData)} onChange={itemChanged}></SelectInput>
                </div>
            </div>
            <div className="row justify-content-center mb-2 pt-2">
                <div className="col-12 col-md-3 col-lg-2 text-center">
                    <TranslatableText identifier="items.type.helmet"></TranslatableText>
                    <SelectInput reference={itemRefs.helmet} noneOption={true} name="helmet" default={getEquipName("helmet")} sortableStats={getRelevantItems(["helmet"], itemData)} onChange={itemChanged}></SelectInput>
                </div>
                <div className="col-12 col-md-3 col-lg-2 text-center">
                    <TranslatableText identifier="items.type.chestplate"></TranslatableText>
                    <SelectInput reference={itemRefs.chestplate} noneOption={true} name="chestplate" default={getEquipName("chestplate")} sortableStats={getRelevantItems(["chestplate"], itemData)} onChange={itemChanged}></SelectInput>
                </div>
                <div className="col-12 col-md-3 col-lg-2 text-center">
                    <TranslatableText identifier="items.type.leggings"></TranslatableText>
                    <SelectInput reference={itemRefs.leggings} noneOption={true} name="leggings" default={getEquipName("leggings")} sortableStats={getRelevantItems(["leggings"], itemData)} onChange={itemChanged}></SelectInput>
                </div>
                <div className="col-12 col-md-3 col-lg-2 text-center">
                    <TranslatableText identifier="items.type.boots"></TranslatableText>
                    <SelectInput reference={itemRefs.boots} noneOption={true} name="boots" default={getEquipName("boots")} sortableStats={getRelevantItems(["boots"], itemData)} onChange={itemChanged}></SelectInput>
                </div>
            </div>
            <div className="row justify-content-center pt-2">
                <TranslatableText identifier="builder.misc.situationals" className="text-center mb-1"></TranslatableText>
                {generateSituationalCheckboxes(itemsToDisplay, checkboxChanged)}
            </div>
            <div className="row justify-content-center mb-2 pt-2">
                <div className="col-12 col-md-3 col-lg-2 text-center">
                    <p className="mb-1"><TranslatableText identifier="builder.misc.region"></TranslatableText></p>
                    <Select 
                        instanceId="this-is-just-here-so-react-doesnt-yell-at-me"
                        id="region"
                        name="region"
                        options={regions} 
                        defaultValue={{ value: 3, label: "Ring" }}
                        theme={theme => ({
                            ...theme,
                            borderRadius: 0,
                            colors: {
                                ...theme.colors,
                                primary: "#bbbbbb",
                                primary25: "#2a2a2a",
                                neutral0: "black",
                                neutral80: "white"
                            },
                        })} 
                        onChange={itemChanged}
                    />
                </div>
                <div className="col-12 col-md-3 col-lg-2 text-center">
                    <p className="mb-1"><TranslatableText identifier="builder.misc.class"></TranslatableText></p>
                    <SelectInput
                        name="class"
                        noneOption={true}
                        sortableStats={classes}
                        onChange={classChanged}
                    />
                </div>
            </div>
            {(gameClass == "none") ? "" : <div className="row justify-content-center pt-2">
                <TranslatableText identifier="builder.misc.classAbilityBuffs" className="text-center mb-1"></TranslatableText>
                {generateClassAbilityBuffCheckboxes(gameClass, buffCheckboxChanged)}
            </div>}
            <div className="row justify-content-center my-2">
                <div className="col text-center">
                    <p className="mb-1"><TranslatableText identifier="builder.misc.maxHealthPercent"></TranslatableText></p>
                    <input type="number" name="health" min="1" defaultValue="100" className="" />
                </div>
                <div className="col text-center">
                    <p className="mb-1">Tenacity</p>
                    <input type="number" name="tenacity" min="0" max="30" defaultValue="0" className="" />
                </div>
                <div className="col text-center">
                    <p className="mb-1">Vitality</p>
                    <input type="number" name="vitality" min="0" max="30" defaultValue="0" className="" />
                </div>
                <div className="col text-center">
                    <p className="mb-1">Vigor</p>
                    <input type="number" name="vigor" min="0" max="30" defaultValue="0" className="" />
                </div>
                <div className="col text-center">
                    <p className="mb-1">Focus</p>
                    <input type="number" name="focus" min="0" max="30" defaultValue="0" className="" />
                </div>
                <div className="col text-center">
                    <p className="mb-1">Perspicacity</p>
                    <input type="number" name="perspicacity" min="0" max="30" defaultValue="0" className="" />
                </div>
            </div>
            <div className="row pt-2">
                <span className="text-center text-danger fs-2 fw-bold">{(stats.corruption > 1) ? <TranslatableText identifier="builder.errors.corruption"></TranslatableText> : ""}</span>
            </div>
            <div className="row py-2">
                <span className="text-center text-danger fs-2 fw-bold">{(stats.twoHanded && !stats.weightless && stats.itemNames.offhand != "None") ? <TranslatableText identifier="builder.errors.twoHanded"></TranslatableText> : ""}</span>
            </div>
            <div className="row mb-2 justify-content-center">
                <div className="col-12 col-md-6 col-lg-2">
                    <ListSelector update={damageMultipliersChanged} translatableName="builder.multipliers.damage"></ListSelector>
                </div>
                <div className="col-12 col-md-6 col-lg-2">
                    <ListSelector update={resistanceMultipliersChanged} translatableName="builder.multipliers.resistance"></ListSelector>
                </div>
                <div className="col-12 col-md-6 col-lg-2">
                    <ListSelector update={healthMultipliersChanged} translatableName="builder.multipliers.health"></ListSelector>
                </div>
                <div className="col-12 col-md-6 col-lg-2">
                    <ListSelector update={speedMultipliersChanged} translatableName="builder.multipliers.speed"></ListSelector>
                </div>
                <div className="col-12 col-md-6 col-lg-2">
                    <ListSelector update={attackSpeedMultipliersChanged} translatableName="builder.multipliers.attackSpeed"></ListSelector>
                </div>
            </div>
            <div className="row my-3">
                <div className="col-12">
                    <CharmSelector update={updateCharms} translatableName={"builder.charms.select"} urlCharms={urlCharms} updateLoaded={updateLoaded} itemData={itemData}></CharmSelector>
                </div>
            </div>
            <div className="row justify-content-center">
                <div className="col-4 col-md-3 col-lg-2 text-center">
                    <button type="submit" className={styles.recalcButton} value="Recalculate">
                        <TranslatableText identifier="builder.buttons.recalculate"></TranslatableText>
                    </button>
                </div>
                <div className="col-4 col-md-3 col-lg-2 text-center">
                    <button type="button" className={styles.shareButton} id="share" onClick={copyBuild}>
                        <TranslatableText identifier="builder.buttons.share"></TranslatableText>
                    </button>
                </div>
                <div className="col-4 col-md-3 col-lg-2 text-center">
                    <button type="button" className={styles.shareButton} id="copyLinkForDiscord" onClick={copyBuildDiscord}>
                        <TranslatableText identifier="builder.buttons.copyLinkForDiscord"></TranslatableText>
                    </button>
                </div>
                <div className="col-4 col-md-3 col-lg-2 text-center">
                    <input type="reset" className={styles.resetButton} />
                </div>
            </div>
            <div className="row justify-content-center mb-2">
                {
                    itemTypes.map(type =>
                        (checkExists(type, stats, itemData)) ?
                            (stats.fullItemData[type].masterwork != undefined) ?
                                <MasterworkableItemTile update={receiveMasterworkUpdate} key={stats.itemNames[type]} name={removeMasterworkFromName(stats.itemNames[type])} item={createMasterworkData(removeMasterworkFromName(stats.itemNames[type]), itemData)} default={Number(stats.itemNames[type].split("-").at(-1))}></MasterworkableItemTile> :
                                <ItemTile key={type} name={stats.itemNames[type]} item={stats.fullItemData[type]}></ItemTile> : ""
                    )
                }
            </div>
        </form>
    )
}
