import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const BookingQr = ({ booking, size = 120 }) => {
    return (
        <div className="p-2 bg-white rounded-xl shadow-sm inline-block ring-1 ring-gray-100">
            <QRCodeCanvas
                value={booking.qrcode || booking.qrCode || ''}
                size={Math.max(300, size * 2)} // High internal resolution for crisp capture
                style={{ width: size, height: size }} // Visual scaling
                level="H"
                includeMargin={false}
                imageSettings={{
                    src: "/logo.png",
                    height: Math.floor((Math.max(300, size * 2)) * 0.15),
                    width: Math.floor((Math.max(300, size * 2)) * 0.15),
                    excavate: true,
                }}
            />
        </div>
    );
};

export default BookingQr;
