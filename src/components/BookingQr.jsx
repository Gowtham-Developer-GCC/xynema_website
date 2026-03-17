import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const BookingQr = ({ booking, size = 120 }) => {
    return (
        <div className="p-2 bg-white rounded-xl shadow-inner inline-block">
            <QRCodeCanvas
                value={booking.qrCode || ''}
                size={Math.max(300, size * 2)} // High internal resolution for crisp PDF capture
                style={{ width: size, height: size }} // Scale back down visually
                level="H"
                includeMargin={false}
                imageSettings={{
                    src: "/logo.png",
                    height: Math.floor((Math.max(300, size * 2)) * 0.15), // Scale logo with QR
                    width: Math.floor((Math.max(300, size * 2)) * 0.15),
                    excavate: true,
                }}
            />
        </div>
    );
};

export default BookingQr;
