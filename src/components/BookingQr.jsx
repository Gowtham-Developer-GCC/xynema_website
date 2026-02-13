import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const BookingQr = ({ booking, size = 120 }) => {
    const generateQrData = () => {
        // Essential data only to avoid "Data too long" errors
        const qrData = {
            "id": booking.id,
        };
        return JSON.stringify(qrData);
    };

    return (
        <div className="p-2 bg-white rounded-xl shadow-inner inline-block">
            <QRCodeCanvas
                value={generateQrData()}
                size={size}
                level="H"
                includeMargin={false}
                imageSettings={{
                    src: "/logo.png", // Fallback if logo exists
                    x: undefined,
                    y: undefined,
                    height: 24,
                    width: 24,
                    excavate: true,
                }}
            />
        </div>
    );
};

export default BookingQr;
