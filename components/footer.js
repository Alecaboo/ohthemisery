import Image from 'next/image'
import styles from '../styles/Footer.module.css'
import GitHubIcon from '@mui/icons-material/GitHub';


export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.inner}>
                <div className={styles.text}>
                    Developed by <b>Albin</b> and <b>FlamingoBike</b>, forked and maintained by <b>Alecaboo</b>, forked again by <b>JC</b>
                </div>
                <div className={styles.links}>
                    <a
                        className={styles.link}
                        href="https://github.com/Alecaboo/ohthemisery"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub"
                        title="GitHub"
                    >
                        <GitHubIcon />
                    </a>
                    <a
                        className={`${styles.link} ${styles.vercel}`}
                        href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span>Powered by</span>
                        <span className={styles.logo}>
                            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
                        </span>
                    </a>
                </div>
            </div>
        </footer>
    )
}
