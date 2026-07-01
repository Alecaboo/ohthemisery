import SupportedLanguages from '../utils/translation/languages';
import Select from 'react-select';
import { setCookie, getCookie } from 'cookies-next';
import { useLanguageContext } from "../pages/_app";
import React from 'react';

const languageNames = {
    'en': "English",
    'it': "Italiano",
    'zh_tw': "繁體中文",
    'zh_cn': "简体中文",
    'hu': "Magyar",
    'ru': "русский",
    'fr': "Français"
}

function LanguageSelector() {
    const options = Object.keys(SupportedLanguages).map(lang => { return { "value": lang, "label": languageNames[lang] } });
    const { lang, setLang } = useLanguageContext();

    function langSelected(lang) {
        setCookie("lang", lang.value);
        setLang(lang.value);
    };

    React.useEffect(() => {
        let cookieLang = getCookie("lang");
        cookieLang = (cookieLang) ? cookieLang : 'en';
        setLang(cookieLang);
    }, [setLang]);
    
    return (
        <div>
            <Select key={lang} instanceId={lang} name="sortSelect" options={options} onChange={langSelected}
            defaultValue={options.find(opt => opt.value == lang)}
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
            })}/>
        </div>
    )
}

export default LanguageSelector;