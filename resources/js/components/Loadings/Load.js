import React from 'react'

export const Load = () => {
    return (
        <div className="flex justify-content-center">
            <div className={'mt-5 mb-3 center'}>

                <div className={'flex justify-content-center'}>
                    <div className="spinner-border color-dark-blue" role="status">
                    </div>
                </div>

                <div className={'text-center mt-3 font-weight-bold'}>
                    Loading ...
                </div>
            </div>

        </div>
    );
};

