import React from 'react';
import InputForm from '../input/InputForm';
import ButtonForm from '../button/ButtonForm';
import styles from './Form.module.scss';

const Form = ({ fields, onSubmit, submitButtonText}) => {
    return (
        <form onSubmit={onSubmit} className={styles.form}>
            {fields.map((field, index) => (
                <InputForm
                    key={index}
                    {...field}
                    />
            ))}
            <ButtonForm type="submit">
                {submitButtonText}
            </ButtonForm>
        </form>
    );
};

export default Form;