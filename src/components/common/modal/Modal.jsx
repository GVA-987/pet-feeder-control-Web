import React from 'react';
import ReactDOM from 'react-dom';
import styles from './Modal.module.scss';

const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className={styles.modalOverlay} onClick={onClose}>
            <div 
                className={`${styles.modalContent} ${styles[size]}`} 
                onClick={e => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{title}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        &times;
                    </button>
                </div>
                
                <div className={styles.modalBody}>
                    {children}
                </div>
            </div>
        </div>,
        document.getElementById('modal-root') 
    );
};

export default Modal;