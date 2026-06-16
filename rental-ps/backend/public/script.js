if(localStorage.getItem('admin') !== 'true'){

    window.location.href = 'login.html';

}

// ================= COUNTDOWN =================

function hitungSisaWaktu(waktuMulai, durasiJam){

    const mulai = new Date(waktuMulai);

    const selesai = new Date(
        mulai.getTime() + durasiJam * 60 * 60 * 1000
    );

    const sekarang = new Date();

    const selisih = selesai - sekarang;

    if(selisih <= 0){

        return "⛔ Waktu Habis";

    }

    const jam = Math.floor(
        selisih / (1000 * 60 * 60)
    );

    const menit = Math.floor(
        (selisih % (1000 * 60 * 60)) / (1000 * 60)
    );

    const detik = Math.floor(
        (selisih % (1000 * 60)) / 1000
    );

    return `${jam}j ${menit}m ${detik}d`;

}

// ================= NOTIF =================

function cekWaktuHabis(item){

    const mulai = new Date(item.waktu);

    const selesai = new Date(
        mulai.getTime() + item.durasi * 60 * 60 * 1000
    );

    const sekarang = new Date();

    const notifKey = `notif_${item.id}`;

    if(sekarang >= selesai){

        if(!localStorage.getItem(notifKey)){

            alert(
                `⏰ Waktu ${item.ps} milik ${item.nama} sudah habis!`
            );

            localStorage.setItem(notifKey,'true');

        }

    }

}

// ================= BOOKING =================

async function bookingPS(){

    const nama =
        document.getElementById('nama').value;

    const ps =
        document.getElementById('ps').value;

    const durasi =
        document.getElementById('durasi').value;

    if(!nama || !durasi){

        alert('Lengkapi data');

        return;
    }

    const harga = durasi * 10000;

    await fetch(
        'http://127.0.0.1:3000/booking',
        {

            method:'POST',

            headers:{
                'Content-Type':'application/json'
            },

            body:JSON.stringify({

    nama,
    ps,
    durasi,
    harga,
    waktu:new Date().toISOString()

})

        }
    );

    document.getElementById('nama').value = '';

    document.getElementById('durasi').value = '';

    loadBookings();
}

window.bookingPS = bookingPS;

// ================= LOAD BOOKINGS =================

async function loadBookings(){

    const response = await fetch(
        'http://127.0.0.1:3000/bookings'
    );

    const data = await response.json();

    const bookingList =
        document.getElementById('bookingList');

    bookingList.innerHTML = '';

    let total = 0;

    let pendapatan = 0;

    let psDipakai = 0;

    // ================= BOOKING AKTIF =================

    data.forEach((item)=>{

        total++;

        pendapatan += item.harga;

        if(item.status === 'Dipakai'){
            psDipakai++;
        }

        cekWaktuHabis(item);

        bookingList.innerHTML += `

            <div class="booking-item">

                <h3>${item.nama}</h3>

                <p>${item.ps}</p>

                <p>${item.durasi} Jam</p>

                <p>Rp ${item.harga}</p>

                <p>${item.waktu}</p>

                <p>
                    ⏳ ${hitungSisaWaktu(
                        item.waktu,
                        item.durasi
                    )}
                </p>

                <p class="${
                    item.status === 'Dipakai'
                    ? 'status-dipakai'
                    : 'status-selesai'
                }">

                    Status: ${item.status}

                </p>

            </div>

        `;

    });

    document.getElementById(
        'totalBooking'
    ).innerText = total;

    document.getElementById(
        'psDipakai'
    ).innerText = psDipakai;

    document.getElementById(
        'pendapatan'
    ).innerText =
        'Rp ' + pendapatan;

    // ================= RIWAYAT =================

    const riwayat =
        document.getElementById('riwayat');

    if(riwayat){

        riwayat.innerHTML = '';

        data
        .filter(item => item.status === 'Selesai')
        .forEach(item => {

            riwayat.innerHTML += `

                <div class="booking-item">

                    <h3>${item.nama}</h3>

                    <p>${item.ps}</p>

                    <p>${item.durasi} Jam</p>

                    <p>Rp ${item.harga}</p>

                    <p>✅ Selesai</p>

                </div>

            `;

        });

    }

}

loadBookings();

// realtime update
setInterval(loadBookings,1000);

// ================= LOGOUT =================

window.logout = function(){

    localStorage.removeItem('admin');

    window.location.href = 'login.html';

}