export default async function handler(req, res) {
    // Hanya izinkan metode POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method tidak diizinkan. Gunakan POST.' });
    }

    // Ambil API Key dari header dan data file dari body request
    const apiKey = req.headers['x-api-key'];
    const { fileName, fileData } = req.body;

    if (!apiKey) {
        return res.status(401).json({ error: 'API Key Roblox tidak ditemukan.' });
    }

    if (!fileName || !fileData) {
        return res.status(400).json({ error: 'Data file tidak lengkap (nama atau file audio hilang).' });
    }

    try {
        // 1. Ubah data Base64 kembali menjadi Buffer/Binary
        const audioBuffer = Buffer.from(fileData, 'base64');
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mp3' });

        // 2. Siapkan Form Data sesuai standar Open Cloud API Roblox
        const formData = new FormData();
        
        // Data konfigurasi aset
        const requestConfig = {
            assetType: "Audio",
            displayName: fileName,
            description: "Uploaded via BRIAN STUDIO Bypass",
            creationContext: {
                creator: {
                    userId: req.headers['x-user-id'] || null // Opsional jika API Key terikat langsung
                }
            }
        };

        // Masukkan konfigurasi dan file audio ke form data
        formData.append('request', JSON.stringify(requestConfig));
        formData.append('fileContent', audioBlob, `${fileName}.mp3`);

        // 3. Kirim ke Endpoint API Roblox
        const robloxResponse = await fetch('https://apis.roblox.com/assets/v1/assets', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey
                // Catatan: Content-Type tidak perlu diatur manual agar browser/fetch bisa mengatur boundary form-data secara otomatis
            },
            body: formData
        });

        const data = await robloxResponse.json();

        // Cek jika Roblox menolak request tersebut
        if (!robloxResponse.ok) {
            console.error("Roblox API Error:", data);
            return res.status(robloxResponse.status).json({ 
                error: data.message || 'Ditolak oleh server Roblox', 
                details: data 
            });
        }

        // 4. Kirim respon sukses kembali ke index.html
        return res.status(200).json({ 
            success: true, 
            message: 'Berhasil diupload ke Roblox',
            assetId: data.assetId || data.path 
        });

    } catch (error) {
        console.error("Server Backend Error:", error);
        return res.status(500).json({ error: 'Terjadi kesalahan pada jaringan server backend (Vercel).' });
    }
              }
