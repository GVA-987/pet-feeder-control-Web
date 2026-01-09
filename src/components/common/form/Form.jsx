import React from 'react';
import InputForm from '../input/InputForm';
import ButtonForm from '../button/ButtonForm';
import styles from './Form.module.scss';

const Form = ({ fields, onSubmit, submitButtonText, buttonPosition = 'bottom'}) => {

    const renderButton = (
        <ButtonForm type="submit">
            {submitButtonText}
        </ButtonForm>
    );

    return (
        <form onSubmit={onSubmit} className={styles.form}>

            {buttonPosition === 'top' && renderButton}
            {fields.map((field, index) => (
                <InputForm
                    key={index}
                    {...field}
                    />
            ))}
            {buttonPosition === 'bottom' && renderButton}
        </form>
    );
};

export default Form;