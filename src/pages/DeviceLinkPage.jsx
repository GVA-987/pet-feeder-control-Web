import React from 'react';
import DeviceLink from '../components/dashboard/deviceLink/DeviceLink';
import Modal from '../components/common/modal/Modal';


function DeviceLinkPage() {
    return (
        <Modal show={true}>
            <DeviceLink />
        </Modal>
    );
}

export default DeviceLinkPage;