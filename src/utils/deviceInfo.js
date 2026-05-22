export const getDeviceInfo = () => {
    const ua = navigator.userAgent;

    let platform = 'web';
    if (/android/i.test(ua)) platform = 'android';
    else if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) platform = 'ios';
    else if (/Win/.test(ua)) platform = 'windows';
    else if (/Mac/.test(ua)) platform = 'mac';
    else if (/Linux/.test(ua)) platform = 'linux';

    let deviceName = 'Unknown Browser';
    if (/Chrome/.test(ua) && !/Edg/.test(ua)) deviceName = 'Chrome';
    else if (/Firefox/.test(ua)) deviceName = 'Firefox';
    else if (/Safari/.test(ua) && !/Chrome/.test(ua)) deviceName = 'Safari';
    else if (/Edg/.test(ua)) deviceName = 'Edge';
    else if (/OPR|Opera/.test(ua)) deviceName = 'Opera';
    deviceName += ` on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`;

    let deviceModel = platform;
    const mobileMatch = ua.match(/Android\s([\d.]+)/);
    if (mobileMatch) {
        const modelMatch = ua.match(/\(([^;]+);\s*([^;)]+)/);
        deviceModel = modelMatch ? modelMatch[2].trim() : `Android ${mobileMatch[1]}`;
    } else if (/iPhone/.test(ua)) {
        const iphoneMatch = ua.match(/iPhone\sOS\s([\d_]+)/);
        deviceModel = iphoneMatch ? `iPhone iOS ${iphoneMatch[1].replace(/_/g, '.')}` : 'iPhone';
    } else if (/iPad/.test(ua)) {
        deviceModel = 'iPad';
    }

    return { deviceName, deviceModel, platform };
};
