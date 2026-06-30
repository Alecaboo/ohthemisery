import Select from 'react-select';
import React from 'react';
import { useLanguageContext } from '../../pages/_app';
import SupportedLanguages from '../../utils/translation/languages';

function convertItemNameForTranslationString(item) {
    if (!item) return "";
    return item.replaceAll('\'', '').replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
        return index == 0  ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
}

const SelectInput = (data) => {
    const { lang } = useLanguageContext();
    const options = data.sortableStats.map(
        item => {
            if (typeof item == "object") {
                return item;
            }

            if (!data.baseTranslationString) {
                return { "value": item, "label": item };
            }

            let translationString = `${data.baseTranslationString}.${convertItemNameForTranslationString(item)}`;
            return {
                "value": item,
                "label": SupportedLanguages[lang][translationString] ? SupportedLanguages[lang][translationString] : item
            };
        }
    );
    
    if (data.noneOption) {
        options.unshift({ "value": "None", "label": "None" });
    }

    return (
        <div>
            <Select
                ref={data.reference}
                instanceId={data.name}
                name={data.name}
                options={options}
                defaultValue={data.default ? data.default : options[0]}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
                theme={theme => ({
                    ...theme,
                    borderRadius: 10,
                    colors: {
                        ...theme.colors,
                        primary: "var(--text-1)",
                        primary25: "var(--surface-2)",
                        neutral0: "var(--glass-1)",
                        neutral5: "var(--glass-2)",
                        neutral10: "var(--glass-2)",
                        neutral20: "var(--control-border)",
                        neutral30: "var(--control-border-hover)",
                        neutral60: "var(--text-2)",
                        neutral80: "var(--text-1)"
                    },
                })}
                styles={{
                    control: (base) => ({ ...base, minHeight: 42, height: 42 }),
                    valueContainer: (base) => ({ ...base, height: 42, paddingTop: 0, paddingBottom: 0 }),
                    indicatorsContainer: (base) => ({ ...base, height: 42 }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    menu: (base) => ({ ...base, zIndex: 9999 }),
                }}
                onChange={data.onChange}
            />
        </div>
    )
}

export default SelectInput;