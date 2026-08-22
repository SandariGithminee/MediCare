function formatConnectionString(urlStr) {
    if (!urlStr) return '';
    let cleanUrl = urlStr.replace(/\?sslmode=\w+/, '').replace(/&sslmode=\w+/, '');

    // Find index of last '@' before host
    const lastAtIndex = cleanUrl.lastIndexOf('@');
    const protocolIndex = cleanUrl.indexOf('://');

    if (protocolIndex !== -1 && lastAtIndex > protocolIndex + 3) {
        const protocol = cleanUrl.slice(0, protocolIndex + 3);
        const hostAndDb = cleanUrl.slice(lastAtIndex + 1);
        const userInfo = cleanUrl.slice(protocolIndex + 3, lastAtIndex);

        const firstColonIndex = userInfo.indexOf(':');
        if (firstColonIndex !== -1) {
            const user = userInfo.slice(0, firstColonIndex);
            const pass = userInfo.slice(firstColonIndex + 1);
            const encodedPass = encodeURIComponent(decodeURIComponent(pass));
            return `${protocol}${user}:${encodedPass}@${hostAndDb}`;
        }
    }
    return cleanUrl;
}

console.log('Test 1:', formatConnectionString('postgresql://postgres:Sandari@123#@db.rgyetagqprwtehywtwlo.supabase.co:5432/postgres'));
console.log('Test 2:', formatConnectionString('postgresql://postgres:Sandari%40123%23@db.rgyetagqprwtehywtwlo.supabase.co:5432/postgres'));
console.log('Test 3:', formatConnectionString('postgresql://neondb_owner:npg_tAO1IjPn9rBx@ep-shiny-cherry-azu7od9r-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'));
