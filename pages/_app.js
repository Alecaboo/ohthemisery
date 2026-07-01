import React from 'react';
import Footer from '../components/footer';
import Header from '../components/header';
import '../styles/globals.css'
import '../public/spritesheets/_itemsheet.css';
import '../public/spritesheets/_charmsheet.css';
import '../public/spritesheets/_minecraft.css';

export const LanguageContext = React.createContext({
  lang: 'en',
  setLang: () => {}
})

export const LanguageContextProvider = ({children}) => {
  const [lang, setLang] = React.useState('en');

  return (
    <LanguageContext.Provider
      value={{
        lang: lang,
        setLang: setLang
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguageContext = () => React.useContext(LanguageContext);

function App({ Component, pageProps }) {
  return (
    <LanguageContextProvider>
      <Header />
      <Component {...pageProps} />
      <Footer />
    </LanguageContextProvider>
  )
}

export default App;
