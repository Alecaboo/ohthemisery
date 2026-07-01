import Select from 'react-select';
import React from 'react';
import styles from '../../styles/SearchForm.module.css';
import { useLanguageContext } from '../../pages/_app';
import SupportedLanguages from '../../utils/translation/languages';

const SelectWithTriggers = (props) => {
    const [firstChild, setFirstChild] = React.useState();
    const { lang } = useLanguageContext();
    const container = React.useRef();
    const opt = props.opts.map(o => {
        return {
            "value": o.name,
            "label": o.translatableName ? (SupportedLanguages[lang][o.translatableName] ? SupportedLanguages[lang][o.translatableName] : o.name) : o.name
        }
    });
    const selectedDefault = props.defaultValue ? props.defaultValue : null;

    function triggerSelection(event) {
        let selectedValue = event.value;
        let child = props.opts.find(o => o.name == selectedValue).select(props.index);
        setFirstChild(child);
    }

    const handleDeleteItem = React.useCallback(() => {
        props.deleteCallback(props.index);
    }, [props]);

    return (
        <div className={props.className}>
            <input className={styles.deleteButton} type='button' value='X' onClick={handleDeleteItem} />
            <Select
                className={`d-inline-block mx-1 ${styles.categoryWidth}`}
                ref={props.reference}
                instanceId={props.name}
                name={props.name}
                defaultValue={selectedDefault}
                options={opt}
                onChange={triggerSelection}
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
            />

            <div ref={container} className={`d-inline-block mx-1 ${styles.selectorWidth}`}>
                {firstChild}
            </div>
        </div>
    )
}

export default SelectWithTriggers;