---
title: "Panduan Menghubungkan VPS ke Cloudflare: Amankan IP & Proteksi Maksimal"
date: "2026-04-18"
description: "Pelajari cara tepat menghubungkan VPS ke Cloudflare. Gunakan fitur Proxy (Orange Cloud) untuk menyembunyikan IP asli, konfigurasi SSL Full (Strict), dan amankan Nginx dari serangan bypass IP."
category: "Teknologi"
image: "/assets/img/vps-cloudflare.png"
---

Menggunakan Cloudflare bukan hanya soal mempercepat website, tapi juga soal keamanan. Salah satu keuntungan terbesarnya adalah kemampuan untuk menyembunyikan IP asli VPS Anda melalui fitur **Proxy (Orange Cloud)**.

Berikut adalah panduan konfigurasi yang tepat agar VPS Anda terhubung dengan aman ke Cloudflare.

## 1. Konfigurasi DNS di Cloudflare
Langkah pertama adalah mengarahkan domain Anda ke IP VPS melalui dashboard Cloudflare:
1. Buka dashboard Cloudflare Anda.
2. Pilih domain **domain-kamu.com**.
3. Masuk ke menu **DNS > Records**.
4. Klik **Add Record**:
   - **Type**: A
   - **Name**: sub (untuk sub.domain-kamu.com)
   - **IPv4 address**: [Masukkan IP VPS Anda]
   - **Proxy status**: Proxied (Awan warna Oranye 🟠).

> Dengan Proxy Oranye, IP VPS Anda akan disembunyikan oleh Cloudflare. Hacker hanya akan melihat IP milik Cloudflare.

## 2. Konfigurasi SSL (PENTING)
Agar Nginx di VPS dan Cloudflare bisa saling "berjabat tangan" dengan aman, Anda perlu mengatur mode enkripsi yang tepat:
- Di Cloudflare, masuk ke menu **SSL/TLS > Overview**.
- Ubah mode SSL menjadi **Full (Strict)**.

## 3. Penyesuaian di Script Deploy
Cloudflare bertindak sebagai "perantara". Ada satu hal yang perlu diperhatikan saat menjalankan certbot (Let's Encrypt) untuk pertama kali:

**Skenario Terbaik:**
1. Di Cloudflare, matikan sementara Proxy (Ubah Oranye 🟠 ke Abu-abu ⚪).
2. Jalankan script `vps-deploy.sh` dan lakukan perintah `sudo certbot --nginx -d sub.domain-kamu.com` sampai sukses.
3. Setelah muncul pesan sukses dari certbot, kembalikan Proxy ke **Oranye 🟠** di Cloudflare.

## 4. Menutup Akses Langsung ke IP (Anti Bypass)
Agar domain tidak bisa "ditembus" langsung lewat IP (menghindari serangan bypass), Anda wajib membatasi akses di level Nginx. Tambahkan konfigurasi ini di file konfigurasi Nginx Anda:

Ganti bagian `listen 80;` dengan blok default untuk membuang request yang tidak menggunakan domain:

```nginx
# Blokir akses via IP langsung
server {
    listen 80 default_server;
    server_name _;
    return 444; # Menutup koneksi tanpa respon
}

# Hanya terima via domain
server {
    listen 80;
    server_name sub.domain-kamu.com;
    # ... rest of your config ...
}
```

## Keuntungan Menggunakan Cloudflare
- **Hide IP**: Hacker tidak tahu IP VPS Anda, mereka hanya melihat IP Cloudflare.
- **WAF (Web Application Firewall)**: Cloudflare otomatis memblokir serangan sub jahat sebelum mencapai VPS.
- **WebSocket Support**: Cloudflare sudah mendukung WebSocket secara default, sangat penting jika sub Anda menggunakannya.
