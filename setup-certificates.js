#!/usr/bin/env node
/**
 * Node.js script to create self-signed SSL certificates for development
 * This replaces the Python certificate creation scripts to avoid Python environment issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkOpenSSL() {
    try {
        execSync('openssl version', { stdio: 'pipe' });
        return true;
    } catch (error) {
        return false;
    }
}

function createDirectories() {
    const dirs = ['certs', 'backend/certs'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`✅ Created directory: ${dir}`);
        }
    });
}

function createCertificates() {
    const certDirs = ['certs', 'backend/certs'];
    
    for (const certDir of certDirs) {
        const certFile = path.join(certDir, 'cert.pem');
        const keyFile = path.join(certDir, 'key.pem');
        
        // Check if certificates already exist
        if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
            console.log(`✅ SSL certificates already exist in ${certDir}`);
            continue;
        }
        
        if (!checkOpenSSL()) {
            console.log('❌ OpenSSL not found. Please install OpenSSL:');
            console.log('   - Windows: Download from https://slproweb.com/products/Win32OpenSSL.html');
            console.log('   - macOS: brew install openssl');
            console.log('   - Ubuntu/Debian: sudo apt-get install openssl');
            console.log('   - CentOS/RHEL: sudo yum install openssl');
            return false;
        }
        
        try {
            console.log(`🔧 Creating SSL certificates in ${certDir}...`);
            
            // Generate self-signed certificate using OpenSSL
            execSync([
                'openssl', 'req', '-x509', '-newkey', 'rsa:2048',
                '-keyout', keyFile, '-out', certFile, '-days', '365', '-nodes',
                '-subj', '/C=US/ST=Development/L=Local/O=GriefGuide/CN=localhost'
            ].join(' '), { stdio: 'pipe' });
            
            console.log(`✅ SSL certificates created successfully in ${certDir}!`);
            console.log(`   Certificate: ${certFile}`);
            console.log(`   Private Key: ${keyFile}`);
            
        } catch (error) {
            console.log(`❌ Failed to create certificates in ${certDir}: ${error.message}`);
            return false;
        }
    }
    
    return true;
}

function main() {
    console.log('🔧 Setting up SSL certificates for HTTPS development...');
    
    createDirectories();
    
    const success = createCertificates();
    if (success) {
        console.log('\n🎉 SSL certificates setup complete!');
        console.log('💡 You can now run: npm run start-https');
    } else {
        console.log('\n⚠️  Certificate creation failed, but you can still use HTTP mode');
        console.log('💡 Run: npm run dev (for HTTP mode)');
    }
    
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main();
}

module.exports = { createCertificates, checkOpenSSL };