/**
 * Aplikasi Al-Qur'an Digital Modern (All Complete Features)
 */

const API_BASE_URL = 'https://equran.id/api/v2';

let allSurahs = [];
let currentSurahNumber = null;
let currentSurahData = null;
let tafsirDataCache = {};
let bookmarks = JSON.parse(localStorage.getItem('quran_bookmarks')) || [];
let lastRead = JSON.parse(localStorage.getItem('quran_last_read')) || null;
let userRecordings = JSON.parse(localStorage.getItem('quran_user_recordings')) || {};
let userStreak = JSON.parse(localStorage.getItem('quran_streak')) || { count: 0, lastDate: null };
let favoriteDoas = JSON.parse(localStorage.getItem('quran_favorite_doas')) || [];

let selectedQari = localStorage.getItem('quran_qari') || '05';
let isAutoPlayOn = false;
let isHafalanModeOn = false;
let currentFontSize = 'md';
let selectedBookmarkFilter = 'All';
let audioSpeeds = [0.75, 1.0, 1.25, 1.5];
let currentSpeedIndex = 1;

let pendingBookmarkItem = null;
let prayerCountdownInterval = null;
let todayPrayerSchedule = null;

let activeAudio = {
  url: null,
  element: document.getElementById('global-audio'),
  isPlaying: false,
  verseKey: null,
  verseIndex: 0
};

let mediaRecorder = null;
let audioChunks = [];
let recordingVerseKey = null;


//kumpulan doa harian
const DOA_HARIAN_DATA = [
  { id: 1, judul: "Doa Sebelum Tidur", arab: "بِسْمِكَ اللّهُمَّ أَحْيَا وَأَمُوْتُ", latin: "Bismikallahumma ahyaa wa amuut", arti: "Dengan nama-Mu ya Allah, aku hidup dan aku mati." },
  { id: 2, judul: "Doa Bangun Tidur", arab: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", latin: "Alhamdu lillahilladzii ahyaanaa ba'da maa amaatanaa wa ilaihin nusyuur", arti: "Segala puji bagi Allah yang menghidupkan kami kembali setelah mematikan kami, dan kepada-Nya kami dibangkitkan." },
  { id: 3, judul: "Doa Sebelum Makan", arab: "اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ", latin: "Allahumma baarik lanaa fii maa razaqtanaa wa qinaa 'adzaaban naar", arti: "Ya Allah, berkahilah kami dalam rezeki yang telah Engkau berikan kepada kami dan peliharalah kami dari siksa api neraka." },
  { id: 4, judul: "Doa Sesudah Makan", arab: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مِنَ الْمُسْلِمِينَ", latin: "Alhamdu lillahilladzii ath'amanaa wa saqaanaa wa ja'alanaa minal muslimiin", arti: "Segala puji bagi Allah yang telah memberi kami makan dan minum, serta menjadikan kami termasuk golongan orang-orang muslim." },
  { id: 5, judul: "Doa Masuk Masjid", arab: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", latin: "Allahummaftah lii abwaaba rahmatik", arti: "Ya Allah, bukakanlah bagiku pintu-pintu rahmat-Mu." },
  { id: 6, judul: "Doa Keluar Masjid", arab: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ", latin: "Allahumma innii as-aluka min fadhlik", arti: "Ya Allah, sesungguhnya aku memohon keutamaan dari-Mu." },
  { id: 7, judul: "Doa Masuk Kamar Mandi", arab: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ", latin: "Allahumma innii a'uudzu bika minal khubutsi wal khabaa-its", arti: "Ya Allah, aku berlindung kepada-Mu dari godaan syetan laki-laki dan syetan perempuan." },
  { id: 8, judul: "Doa Keluar Kamar Mandi", arab: "غُفْرَانَكَ الْحَمْدُ لِلَّهِ الَّذِي أَذْهَبَ عَنِّي الأَذَى وَعَافَانِي", latin: "Ghufraanakal hamdu lillahilladzii adzhaba 'annil adzaa wa 'aafaanii", arti: "Aku memohon ampunan-Mu. Segala puji bagi Allah yang telah menghilangkan penyakit dari tubuhku dan menyembuhkanku." },
  { id: 9, judul: "Doa Memakai Pakaian", arab: "الْحَمْدُ لِلَّهِ الَّذِي كَسَانِي هَذَا الثَّوْبَ وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلاَ قُوَّةٍ", latin: "Alhamdu lillahilladzii kasaanii hadzat tsauba wa razaqaniihi min ghairi haulin minnii wa laa quwwah", arti: "Segala puji bagi Allah yang telah memakaikan pakaian ini kepadaku dan memberikannya rezeki tanpa daya dan kekuatan dariku." },
  { id: 10, judul: "Doa Keluar Rumah", arab: "بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ لاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللَّهِ", latin: "Bismillahi tawakkaltu 'alallah laa haula wa laa quwwata illaa billah", arti: "Dengan nama Allah, aku bertawakal kepada Allah. Tiada daya dan kekuatan melainkan dengan pertolongan Allah." },
  { id: 11, judul: "Doa Masuk Rumah", arab: "بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا", latin: "Bismillahi walajnaa wa bismillahi kharajnaa wa 'alallahi rabbinaa tawakkalnaa", arti: "Dengan nama Allah kami masuk, dan dengan nama Allah kami keluar, serta kepada Allah Tuhan kami, kami bertawakal." },
  { id: 12, judul: "Doa Naik Kendaraan", arab: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ", latin: "Subhaanalladzii sakhkhara lanaa hadzaa wa maa kunnaa lahu muqriniin wa innaa ilaa rabbinaa lamunqalibuun", arti: "Maha Suci Allah yang telah menundukkan semua ini bagi kami padahal kami sebelumnya tidak mampu menguasainya, dan sesungguhnya kami akan kembali kepada Tuhan kami." },
  { id: 13, judul: "Doa Kebaikan Dunia Akhirat (Sapu Jagat)", arab: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", latin: "Rabbanaa aatinaa fid dunyaa hasanah wa fil aakhirati hasanah wa qinaa 'adzaaban naar", arti: "Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat dan peliharalah kami dari siksa neraka." },
  { id: 14, judul: "Doa Memohon Ilmu yang Bermanfaat", arab: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلاً مُتَقَبَّلاً", latin: "Allahumma innii as-aluka 'ilman naafi'aw wa rizqan thayyibaw wa 'amalam mutaqabbalaa", arti: "Ya Allah, sesungguhnya aku memohon kepada-Mu ilmu yang bermanfaat, rezeki yang baik, dan amalan yang diterima." },
  { id: 15, judul: "Doa untuk Kedua Orang Tua", arab: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا", latin: "Rabbighfir lii wa liwaalidayya warhamhumaa kamaa rabbayaanii shaghiiraa", arti: "Ya Tuhan kami, ampunilah aku dan kedua orang tuaku, dan kasihilah keduanya sebagaimana mereka merawatku di waktu kecil." }
];

// 99 Asmaul Husna Lengkap
const ASMAUL_HUSNA_DATA = [
  { no: 1, latin: "Ar-Rahman", arab: "الرَّحْمَنُ", arti: "Yang Maha Pengasih" },
  { no: 2, latin: "Ar-Rahim", arab: "الرَّحِيمُ", arti: "Yang Maha Penyayang" },
  { no: 3, latin: "Al-Malik", arab: "الْمَلِكُ", arti: "Yang Maha Merajai" },
  { no: 4, latin: "Al-Quddus", arab: "الْقُدُّوسُ", arti: "Yang Maha Suci" },
  { no: 5, latin: "As-Salam", arab: "السَّلاَمُ", arti: "Yang Maha Memberi Kesejahteraan" },
  { no: 6, latin: "Al-Mu'min", arab: "الْمُؤْمِنُ", arti: "Yang Maha Memberi Keamanan" },
  { no: 7, latin: "Al-Muhaimin", arab: "الْمُهَيْمِنُ", arti: "Yang Maha Pemelihara" },
  { no: 8, latin: "Al-Aziz", arab: "الْعَزِيزُ", arti: "Yang Maha Perkasa" },
  { no: 9, latin: "Al-Jabbar", arab: "الْجَبَّارُ", arti: "Yang Memiliki Mutlak Kegagahan" },
  { no: 10, latin: "Al-Mutakabbir", arab: "الْمُتَكَبِّرُ", arti: "Yang Maha Megah" },
  { no: 11, latin: "Al-Khaliq", arab: "الْخَالِقُ", arti: "Yang Maha Pencipta" },
  { no: 12, latin: "Al-Bari'", arab: "الْبَارِئُ", arti: "Yang Maha Melepaskan" },
  { no: 13, latin: "Al-Mushawwir", arab: "الْمُصَوِّرُ", arti: "Yang Maha Membentuk Rupa" },
  { no: 14, latin: "Al-Ghaffar", arab: "الْغَفَّارُ", arti: "Yang Maha Pengampun" },
  { no: 15, latin: "Al-Qahhar", arab: "الْقَهَّارُ", arti: "Yang Maha Memaksa" },
  { no: 16, latin: "Al-Wahhab", arab: "الْوَهَّابُ", arti: "Yang Maha Pemberi Karunia" },
  { no: 17, latin: "Ar-Razzaq", arab: "الرَّزَّاقُ", arti: "Yang Maha Pemberi Rezeki" },
  { no: 18, latin: "Al-Fattah", arab: "الْفَتَّاحُ", arti: "Yang Maha Pembuka Rahmat" },
  { no: 19, latin: "Al-'Alim", arab: "الْعَلِيمُ", arti: "Yang Maha Mengetahui" },
  { no: 20, latin: "Al-Qabidh", arab: "الْقَابِضُ", arti: "Yang Maha Menyempitkan" },
  { no: 21, latin: "Al-Basith", arab: "الْبَاسِطُ", arti: "Yang Maha Melapangkan" },
  { no: 22, latin: "Al-Khafidh", arab: "الْخَافِضُ", arti: "Yang Maha Merendahkan" },
  { no: 23, latin: "Ar-Rafi'", arab: "الرَّافِعُ", arti: "Yang Maha Meninggikan" },
  { no: 24, latin: "Al-Mu'izz", arab: "الْمُعِزُّ", arti: "Yang Maha Memuliakan" },
  { no: 25, latin: "Al-Mudzill", arab: "المُذِلُّ", arti: "Yang Maha Hina" },
  { no: 26, latin: "As-Sami'", arab: "السَّمِيعُ", arti: "Yang Maha Mendengar" },
  { no: 27, latin: "Al-Bashir", arab: "الْبَصِيرُ", arti: "Yang Maha Melihat" },
  { no: 28, latin: "Al-Hakam", arab: "الْحَكَمُ", arti: "Yang Maha Menetapkan Hukum" },
  { no: 29, latin: "Al-'Adl", arab: "الْعَدْلُ", arti: "Yang Maha Adil" },
  { no: 30, latin: "Al-Lathif", arab: "اللَّطِيفُ", arti: "Yang Maha Lembut" },
  { no: 31, latin: "Al-Khabir", arab: "الْخَبِيرُ", arti: "Yang Maha Mengenal" },
  { no: 32, latin: "Al-Halim", arab: "الْحَلِيمُ", arti: "Yang Maha Penyantun" },
  { no: 33, latin: "Al-'Azhim", arab: "الْعَظِيمُ", arti: "Yang Maha Agung" },
  { no: 34, latin: "Al-Ghafur", arab: "الْغَفُورُ", arti: "Yang Maha Memberi Pengampunan" },
  { no: 35, latin: "Asy-Syakur", arab: "الشَّكُورُ", arti: "Yang Maha Pembalas Budi" },
  { no: 36, latin: "Al-'Aliyy", arab: "الْعَلِيُّ", arti: "Yang Maha Tinggi" },
  { no: 37, latin: "Al-Kabir", arab: "الْكَبِيرُ", arti: "Yang Maha Besar" },
  { no: 38, latin: "Al-Hafizh", arab: "الْحَفِيظُ", arti: "Yang Maha Memelihara" },
  { no: 39, latin: "Al-Muqit", arab: "المُقِيتُ", arti: "Yang Maha Pemberi Kecukupan" },
  { no: 40, latin: "Al-Hasib", arab: "الْحَسِيبُ", arti: "Yang Maha Membuat Perhitungan" },
  { no: 41, latin: "Al-Jalil", arab: "الْجَلِيلُ", arti: "Yang Maha Luhur" },
  { no: 42, latin: "Al-Karim", arab: "الْكَرِيمُ", arti: "Yang Maha Pemurah" },
  { no: 43, latin: "Ar-Raqib", arab: "الرَّقِيبُ", arti: "Yang Maha Mengawasi" },
  { no: 44, latin: "Al-Mujib", arab: "الْمُجِيبُ", arti: "Yang Maha Mengabulkan" },
  { no: 45, latin: "Al-Wasi'", arab: "الْوَاسِعُ", arti: "Yang Maha Luas" },
  { no: 46, latin: "Al-Hakim", arab: "الْحَكِيمُ", arti: "Yang Maha Bijaksana" },
  { no: 47, latin: "Al-Wadud", arab: "الْوَدُودُ", arti: "Yang Maha Mengasihi" },
  { no: 48, latin: "Al-Majid", arab: "الْمَجِيدُ", arti: "Yang Maha Mulia" },
  { no: 49, latin: "Al-Ba'its", arab: "الْبَاعِثُ", arti: "Yang Maha Membangkitkan" },
  { no: 50, latin: "Asy-Syahid", arab: "الشَّهِيدُ", arti: "Yang Maha Menyaksikan" },
  { no: 51, latin: "Al-Haqq", arab: "الْحَقُّ", arti: "Yang Maha Benar" },
  { no: 52, latin: "Al-Wakil", arab: "الْوَكِيلُ", arti: "Yang Maha Memelihara" },
  { no: 53, latin: "Al-Qawiyyu", arab: "الْقَوِيُّ", arti: "Yang Maha Kuat" },
  { no: 54, latin: "Al-Matin", arab: "الْمَتِينُ", arti: "Yang Maha Kokoh" },
  { no: 55, latin: "Al-Waliyy", arab: "الْوَلِيُّ", arti: "Yang Maha Melindungi" },
  { no: 56, latin: "Al-Hamid", arab: "الْحَمِيدُ", arti: "Yang Maha Terpuji" },
  { no: 57, latin: "Al-Muhshi", arab: "الْمُحْصِي", arti: "Yang Maha Mengalkulasi" },
  { no: 58, latin: "Al-Mubdi'", arab: "الْمُبْدِئُ", arti: "Yang Maha Memulai" },
  { no: 59, latin: "Al-Mu'id", arab: "الْمُعِيدُ", arti: "Yang Maha Mengembalikan Kehidupan" },
  { no: 60, latin: "Al-Muhyi", arab: "الْمُحْيِي", arti: "Yang Maha Menghidupkan" },
  { no: 61, latin: "Al-Mumit", arab: "الْمُمِيتُ", arti: "Yang Maha Mematikan" },
  { no: 62, latin: "Al-Hayyu", arab: "الْحَيُّ", arti: "Yang Maha Hidup" },
  { no: 63, latin: "Al-Qayyum", arab: "الْقَيُّومُ", arti: "Yang Maha Mandiri" },
  { no: 64, latin: "Al-Wajid", arab: "الْوَاجِدُ", arti: "Yang Maha Penemu" },
  { no: 65, latin: "Al-Majid", arab: "الْمَاجِدُ", arti: "Yang Maha Mulia" },
  { no: 66, latin: "Al-Wahid", arab: "الْوَاحِدُ", arti: "Yang Maha Tunggal" },
  { no: 67, latin: "Al-Ahad", arab: "الأَحَدُ", arti: "Yang Maha Esa" },
  { no: 68, latin: "As-Shamad", arab: "الصَّمَدُ", arti: "Yang Maha Dibutuhkan" },
  { no: 69, latin: "Al-Qadir", arab: "الْقَادِرُ", arti: "Yang Maha Menentukan" },
  { no: 70, latin: "Al-Muqtadir", arab: "الْمُقْتَدِرُ", arti: "Yang Maha Berkuasa" },
  { no: 71, latin: "Al-Muqaddim", arab: "الْمُقَدِّمُ", arti: "Yang Maha Mendahulukan" },
  { no: 72, latin: "Al-Mu'akhkhir", arab: "الْمُؤَخِّرُ", arti: "Yang Maha Mengakhirkan" },
  { no: 73, latin: "Al-Awwal", arab: "الأَوَّلُ", arti: "Yang Maha Awal" },
  { no: 74, latin: "Al-Akhir", arab: "الأَخِرُ", arti: "Yang Maha Akhir" },
  { no: 75, latin: "Az-Zhahir", arab: "الظَّاهِرُ", arti: "Yang Maha Nyata" },
  { no: 76, latin: "Al-Bathin", arab: "الْبَاطِنُ", arti: "Yang Maha Ghaib" },
  { no: 77, latin: "Al-Wali", arab: "الْوَالِي", arti: "Yang Maha Memerintah" },
  { no: 78, latin: "Al-Muta'ali", arab: "الْمُتَعَالِي", arti: "Yang Maha Tinggi" },
  { no: 79, latin: "Al-Barr", arab: "الْبَرُّ", arti: "Yang Maha Penderma" },
  { no: 80, latin: "At-Tawwab", arab: "التَّوَّابُ", arti: "Yang Maha Penerima Taubat" },
  { no: 81, latin: "Al-Muntaqim", arab: "الْمُنْتَقِمُ", arti: "Yang Maha Pemberi Balasan" },
  { no: 82, latin: "Al-'Afuww", arab: "الْعَفُوُّ", arti: "Yang Maha Pemaaf" },
  { no: 83, latin: "Ar-Ra'uf", arab: "الرَّؤُوفُ", arti: "Yang Maha Pengasuh" },
  { no: 84, latin: "Malikul Mulk", arab: "مَالِكُ الْمُلْكِ", arti: "Yang Maha Penguasa Kerajaan" },
  { no: 85, latin: "Dzul Jalali wal Ikram", arab: "ذُوالْجَلاَلِ وَالإِكْرَامِ", arti: "Yang Maha Memiliki Keagungan dan Kemuliaan" },
  { no: 86, latin: "Al-Muqsith", arab: "الْمُقْسِطُ", arti: "Yang Maha Pemberi Keadilan" },
  { no: 87, latin: "Al-Jami'", arab: "الْجَامِعُ", arti: "Yang Maha Mengumpulkan" },
  { no: 88, latin: "Al-Ghaniyy", arab: "الْغَنِيُّ", arti: "Yang Maha Kaya" },
  { no: 89, latin: "Al-Mughni", arab: "الْمُغْنِي", arti: "Yang Maha Memberi Kekayaan" },
  { no: 90, latin: "Al-Mani'", arab: "الْمَانِعُ", arti: "Yang Maha Mencegah" },
  { no: 91, latin: "Adh-Dharr", arab: "الضَّارُّ", arti: "Yang Maha Penimpa Kemudharatan" },
  { no: 92, latin: "An-Nafi'", arab: "النَّافِعُ", arti: "Yang Maha Memberi Manfaat" },
  { no: 93, latin: "An-Nur", arab: "النُّورُ", arti: "Yang Maha Bercahaya" },
  { no: 94, latin: "Al-Hadi", arab: "الْهَادِي", arti: "Yang Maha Memberi Petunjuk" },
  { no: 95, latin: "Al-Badi'", arab: "الْبَدِيعُ", arti: "Yang Maha Pencipta Indah" },
  { no: 96, latin: "Al-Baqi", arab: "الْبَاقِي", arti: "Yang Maha Kekal" },
  { no: 97, latin: "Al-Warits", arab: "الْوَارِثُ", arti: "Yang Maha Mewarisi" },
  { no: 98, latin: "Ar-Rasyid", arab: "الرَّشِيدُ", arti: "Yang Maha Pandai" },
  { no: 99, latin: "As-Shabur", arab: "الصَّبُورُ", arti: "Yang Maha Sabar" }
];
// DOM Elements
const surahListView = document.getElementById('surah-list-view');
const surahDetailView = document.getElementById('surah-detail-view');
const surahGrid = document.getElementById('surah-grid');
const surahCountEl = document.getElementById('surah-count');
const searchInput = document.getElementById('search-input');
const backToListBtn = document.getElementById('back-to-list');

const lastReadCard = document.getElementById('last-read-card');
const lrTitle = document.getElementById('lr-title');
const lrSubtitle = document.getElementById('lr-subtitle');
const lrTime = document.getElementById('lr-time');
const lrResumeBtn = document.getElementById('lr-resume-btn');

const surahHeaderCard = document.getElementById('surah-header-card');
const bismillahContainer = document.getElementById('bismillah-container');
const versesContainer = document.getElementById('verses-container');

const prevSurahBtn = document.getElementById('prev-surah-btn');
const nextSurahBtn = document.getElementById('next-surah-btn');
const qariSelect = document.getElementById('qari-select');

const themeMenuBtn = document.getElementById('theme-menu-btn');
const themeMenuDropdown = document.getElementById('theme-menu-dropdown');

const kiblatBtn = document.getElementById('kiblat-btn');
const kiblatModal = document.getElementById('kiblat-modal');
const closeKiblatModalBtn = document.getElementById('close-kiblat-modal');

const bookmarkBtn = document.getElementById('bookmark-btn');
const bookmarkModal = document.getElementById('bookmark-modal');
const closeModalBtn = document.getElementById('close-modal');
const bookmarkList = document.getElementById('bookmark-list');
const bookmarkCountEl = document.getElementById('bookmark-count');
const bookmarkCategoryFilters = document.getElementById('bookmark-category-filters');

const categoryPickerModal = document.getElementById('category-picker-modal');
const categorySelectInput = document.getElementById('category-select-input');
const customCategoryInput = document.getElementById('custom-category-input');
const cancelBookmarkCategoryBtn = document.getElementById('cancel-bookmark-category');
const saveBookmarkCategoryBtn = document.getElementById('save-bookmark-category');

const doaBtn = document.getElementById('doa-btn');
const doaModal = document.getElementById('doa-modal');
const closeDoaModalBtn = document.getElementById('close-doa-modal');
const tabDoa = document.getElementById('tab-doa');
const tabAsmaul = document.getElementById('tab-asmaul');
const doaModalContent = document.getElementById('doa-modal-content');

const hafalanModeBtn = document.getElementById('hafalan-mode-btn');
const hafalanStatus = document.getElementById('hafalan-status');

const tafsirModal = document.getElementById('tafsir-modal');
const closeTafsirModalBtn = document.getElementById('close-tafsir-modal');
const tafsirTitle = document.getElementById('tafsir-title');
const tafsirContent = document.getElementById('tafsir-content');

const sholatBtn = document.getElementById('sholat-btn');
const sholatModal = document.getElementById('sholat-modal');
const closeSholatModalBtn = document.getElementById('close-sholat-modal');
const citySelect = document.getElementById('city-select');
const sholatDateInfo = document.getElementById('sholat-date-info');
const sholatTimesGrid = document.getElementById('sholat-times-grid');

const prayerNextName = document.getElementById('next-prayer-name');
const prayerNextLocation = document.getElementById('next-prayer-location');
const prayerTimer = document.getElementById('prayer-timer');

const audioBar = document.getElementById('audio-bar');
const audioTitle = document.getElementById('audio-title');
const audioSubtitle = document.getElementById('audio-subtitle');
const audioPlayBtn = document.getElementById('audio-play-btn');
const audioCloseBtn = document.getElementById('audio-close-btn');
const audioPrevBtn = document.getElementById('audio-prev-btn');
const audioNextBtn = document.getElementById('audio-next-btn');
const audioSpeedBtn = document.getElementById('audio-speed-btn');
const autoplayToggleBtn = document.getElementById('autoplay-toggle-btn');
const autoplayStatus = document.getElementById('autoplay-status');

const fontIncreaseBtn = document.getElementById('font-increase-btn');
const fontDecreaseBtn = document.getElementById('font-decrease-btn');
const toastEl = document.getElementById('toast');

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  fetchSurahList();
  setupEventListeners();
  updateBookmarkBadge();
  checkLastReadUI();
  updateStreakCounter();
  initPrayerCountdown();
  qariSelect.value = selectedQari;
});

function setupEventListeners() {
  searchInput.addEventListener('input', handleSearch);
  backToListBtn.addEventListener('click', showSurahList);
  document.getElementById('home-link').addEventListener('click', (e) => {
    e.preventDefault();
    showSurahList();
  });

  prevSurahBtn.addEventListener('click', () => {
    if (currentSurahNumber > 1) loadSurahDetail(currentSurahNumber - 1);
  });

  nextSurahBtn.addEventListener('click', () => {
    if (currentSurahNumber < 114) loadSurahDetail(currentSurahNumber + 1);
  });

  qariSelect.addEventListener('change', (e) => {
    selectedQari = e.target.value;
    localStorage.setItem('quran_qari', selectedQari);
  });

  fontIncreaseBtn.addEventListener('click', () => changeFontSize('up'));
  fontDecreaseBtn.addEventListener('click', () => changeFontSize('down'));

  hafalanModeBtn.addEventListener('click', toggleHafalanMode);

  themeMenuBtn.addEventListener('click', () => {
    themeMenuDropdown.classList.toggle('hidden');
  });

  kiblatBtn.addEventListener('click', openKiblatModal);
  closeKiblatModalBtn.addEventListener('click', () => kiblatModal.classList.add('hidden'));

  bookmarkBtn.addEventListener('click', openBookmarkModal);
  closeModalBtn.addEventListener('click', () => bookmarkModal.classList.add('hidden'));

  cancelBookmarkCategoryBtn.addEventListener('click', () => categoryPickerModal.classList.add('hidden'));
  saveBookmarkCategoryBtn.addEventListener('click', saveBookmarkWithCategory);

  doaBtn.addEventListener('click', openDoaModal);
  closeDoaModalBtn.addEventListener('click', () => doaModal.classList.add('hidden'));
  tabDoa.addEventListener('click', () => switchDoaTab('doa'));
  tabAsmaul.addEventListener('click', () => switchDoaTab('asmaul'));

  closeTafsirModalBtn.addEventListener('click', () => tafsirModal.classList.add('hidden'));

  sholatBtn.addEventListener('click', openSholatModal);
  closeSholatModalBtn.addEventListener('click', () => sholatModal.classList.add('hidden'));
  citySelect.addEventListener('change', () => {
    fetchJadwalSholat();
    initPrayerCountdown();
  });

  audioPlayBtn.addEventListener('click', toggleAudioPlay);
  audioCloseBtn.addEventListener('click', stopAudio);
  audioPrevBtn.addEventListener('click', playPreviousAyatAudio);
  audioNextBtn.addEventListener('click', playNextAyatAudio);
  audioSpeedBtn.addEventListener('click', toggleAudioSpeed);
  autoplayToggleBtn.addEventListener('click', toggleAutoPlay);

  activeAudio.element.addEventListener('ended', () => {
    if (isAutoPlayOn && currentSurahData && activeAudio.verseKey !== 'full') {
      playNextAyatAudio();
    } else {
      activeAudio.isPlaying = false;
      audioPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      updatePlayingVerseUI(null);
    }
  });
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.remove('opacity-0', 'pointer-events-none');
  setTimeout(() => {
    toastEl.classList.add('opacity-0', 'pointer-events-none');
  }, 2500);
}

// FITUR 1: TEMA WARNA (COLOR THEMES)
function setAppTheme(themeName) {
  document.body.className = document.body.className.replace(/theme-\w+/g, '');
  document.body.classList.add(`theme-${themeName}`);
  localStorage.setItem('quran_theme', themeName);
  themeMenuDropdown.classList.add('hidden');
}

function initTheme() {
  const savedTheme = localStorage.getItem('quran_theme') || 'slate';
  setAppTheme(savedTheme);
}

// FITUR 2: KOMPAS KIBLAT
function openKiblatModal() {
  kiblatModal.classList.remove('hidden');
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      if (e.alpha !== null) {
        const compassHeading = e.alpha;
        const kiblatDegree = 295.2; // Derajat kiblat Indonesia relatif
        const rotation = kiblatDegree - compassHeading;
        document.getElementById('compass-pointer').style.transform = `rotate(${rotation}deg)`;
      }
    });
  }
}

// FITUR 3: AUDIO SPEED CONTROLLER
function toggleAudioSpeed() {
  currentSpeedIndex = (currentSpeedIndex + 1) % audioSpeeds.length;
  const speed = audioSpeeds[currentSpeedIndex];
  activeAudio.element.playbackRate = speed;
  audioSpeedBtn.textContent = `${speed}x`;
  showToast(`Kecepatan Audio: ${speed}x`);
}

// FITUR 5: BACKUP & RESTORE DATA (JSON)
function exportUserData() {
  const backupData = {
    bookmarks,
    lastRead,
    userRecordings,
    userStreak,
    favoriteDoas
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `quran_app_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('Backup data berhasil diunduh!');
}

function importUserData(event) {
  const fileReader = new FileReader();
  fileReader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.bookmarks) localStorage.setItem('quran_bookmarks', JSON.stringify(data.bookmarks));
      if (data.lastRead) localStorage.setItem('quran_last_read', JSON.stringify(data.lastRead));
      if (data.userRecordings) localStorage.setItem('quran_user_recordings', JSON.stringify(data.userRecordings));
      
      showToast('Data berhasil di-restore! Memuat ulang...');
      setTimeout(() => location.reload(), 1500);
    } catch (err) {
      alert('File backup JSON tidak valid.');
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// STREAK COUNTER
function updateStreakCounter() {
  const today = new Date().toISOString().split('T')[0];
  if (userStreak.lastDate) {
    const last = new Date(userStreak.lastDate);
    const now = new Date(today);
    const diffDays = Math.ceil(Math.abs(now - last) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) userStreak.count = 0;
  }
  if (userStreak.lastDate !== today) {
    userStreak.count += 1;
    userStreak.lastDate = today;
    localStorage.setItem('quran_streak', JSON.stringify(userStreak));
  }
  document.getElementById('streak-count').textContent = userStreak.count;
}

// FONT SIZE
function changeFontSize(direction) {
  const sizes = ['sm', 'md', 'lg'];
  let index = sizes.indexOf(currentFontSize);
  if (direction === 'up' && index < sizes.length - 1) index++;
  if (direction === 'down' && index > 0) index--;
  currentFontSize = sizes[index];
  document.body.className = document.body.className.replace(/font-(sm|md|lg)/g, '');
  document.body.classList.add(`font-${currentFontSize}`);
}

// MODE HAFALAN
function toggleHafalanMode() {
  isHafalanModeOn = !isHafalanModeOn;
  hafalanStatus.textContent = isHafalanModeOn ? 'On' : 'Off';
  hafalanModeBtn.className = isHafalanModeOn
    ? 'px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-400 font-bold transition flex items-center gap-1.5'
    : 'px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-emerald-400 transition flex items-center gap-1.5';
  if (currentSurahData) renderVerses(currentSurahData.ayat);
}

async function fetchSurahList() {
  try {
    const response = await fetch(`${API_BASE_URL}/surat`);
    const result = await response.json();
    if (result.code === 200) {
      allSurahs = result.data;
      renderSurahGrid(allSurahs);
    }
  } catch (error) {
    surahGrid.innerHTML = `<div class="col-span-full text-center text-red-400 py-8">Gagal memuat daftar surah.</div>`;
  }
}

function renderSurahGrid(surahs) {
  surahCountEl.textContent = surahs.length;
  surahGrid.innerHTML = surahs.map(surah => `
    <div onclick="loadSurahDetail(${surah.nomor})" class="bg-slate-800 border border-slate-700 hover:border-emerald-500/50 p-4 rounded-xl cursor-pointer transition duration-200 group flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-slate-700/50 text-emerald-400 font-bold flex items-center justify-center text-sm group-hover:bg-emerald-500 group-hover:text-slate-900 transition">${surah.nomor}</div>
        <div>
          <h3 class="font-bold text-slate-100 group-hover:text-emerald-400 transition">${surah.namaLatin}</h3>
          <p class="text-xs text-slate-400">${surah.arti} • ${surah.jumlahAyat} Ayat</p>
        </div>
      </div>
      <div class="text-right">
        <span class="font-arabic text-xl text-emerald-400 block">${surah.nama}</span>
        <span class="text-[10px] uppercase tracking-wider text-slate-500">${surah.tempatTurun}</span>
      </div>
    </div>
  `).join('');
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  const filtered = allSurahs.filter(s => s.namaLatin.toLowerCase().includes(query) || s.arti.toLowerCase().includes(query) || s.nomor.toString() === query);
  renderSurahGrid(filtered);
}

async function loadSurahDetail(surahNumber) {
  currentSurahNumber = surahNumber;
  showSurahDetailView();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  prevSurahBtn.disabled = surahNumber <= 1;
  nextSurahBtn.disabled = surahNumber >= 114;

  versesContainer.innerHTML = `<div class="py-16 text-center text-slate-400 space-y-3"><i class="fa-solid fa-spinner fa-spin text-3xl text-emerald-400"></i><p>Memuat Surah...</p></div>`;

  try {
    const response = await fetch(`${API_BASE_URL}/surat/${surahNumber}`);
    const result = await response.json();
    if (result.code === 200) {
      currentSurahData = result.data;
      surahHeaderCard.innerHTML = `
        <span class="text-xs uppercase font-semibold text-emerald-400 tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">${currentSurahData.tempatTurun} • ${currentSurahData.jumlahAyat} Ayat</span>
        <h2 class="text-3xl font-bold text-slate-100">${currentSurahData.namaLatin} (${currentSurahData.nama})</h2>
        <p class="text-sm text-slate-400 max-w-xl mx-auto">"${currentSurahData.arti}"</p>
        <div class="pt-2 flex justify-center gap-3">
          <button onclick="playFullSurahAudio()" class="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition">
            <i class="fa-solid fa-play"></i> Putar Full Surah
          </button>
        </div>
      `;

      if (surahNumber === 9 || surahNumber === 1) {
        bismillahContainer.classList.add('hidden');
      } else {
        bismillahContainer.classList.remove('hidden');
      }
      renderVerses(currentSurahData.ayat);
    }
  } catch (error) {
    versesContainer.innerHTML = `<div class="text-center text-red-400 py-8">Gagal memuat isi surah.</div>`;
  }
}

function renderVerses(ayatList) {
  versesContainer.innerHTML = ayatList.map((ayat, index) => {
    const verseKey = `${currentSurahNumber}:${ayat.nomorAyat}`;
    const isBookmarked = bookmarks.some(b => b.key === verseKey);
    const isPlaying = activeAudio.verseKey === verseKey && activeAudio.isPlaying;
    const hasUserRec = userRecordings[verseKey] ? true : false;
    const isRecordingThis = recordingVerseKey === verseKey;

    return `
      <div id="verse-${ayat.nomorAyat}" class="bg-slate-800/80 border ${isPlaying ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-slate-700/70'} p-5 sm:p-6 rounded-2xl space-y-4 transition-all duration-200">
        <div class="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-xl border border-slate-700/30 flex-wrap gap-2">
          <span class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">${ayat.nomorAyat}</span>

          <div class="flex items-center gap-2 flex-wrap">
            <button onclick="playVerseAudio(${index})" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition">
              <i class="fa-solid ${isPlaying ? 'fa-pause text-emerald-400' : 'fa-play'}"></i>
              <span>${hasUserRec ? 'Suara Saya' : 'Qari'}</span>
            </button>

            <button onclick="openTafsirModal(${ayat.nomorAyat})" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 transition">
              <i class="fa-solid fa-book-open text-emerald-400"></i>
              <span class="hidden sm:inline">Tafsir</span>
            </button>

            <button onclick="copyVerseText('${currentSurahData.namaLatin}', ${ayat.nomorAyat}, \`${ayat.teksArab}\`, \`${ayat.teksIndonesia.replace(/'/g, "\\'")}\`)" class="p-2 text-slate-400 hover:text-emerald-400 text-xs transition">
              <i class="fa-solid fa-copy"></i>
            </button>

            <button onclick="shareToWhatsApp('${currentSurahData.namaLatin}', ${ayat.nomorAyat}, \`${ayat.teksArab}\`, \`${ayat.teksIndonesia.replace(/'/g, "\\'")}\`)" class="p-2 text-slate-400 hover:text-emerald-400 text-xs transition">
              <i class="fa-brands fa-whatsapp"></i>
            </button>

            <button onclick="toggleRecordVerse('${verseKey}')" class="px-3 py-1.5 rounded-lg ${isRecordingThis ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'} text-xs flex items-center gap-1.5 transition">
              <i class="fa-solid ${isRecordingThis ? 'fa-stop' : 'fa-microphone'}"></i>
              <span>${isRecordingThis ? 'Berhenti' : (hasUserRec ? 'Rekam Ulang' : 'Rekam')}</span>
            </button>

            <button onclick="promptBookmarkCategory('${verseKey}', '${currentSurahData.namaLatin}', ${ayat.nomorAyat}, \`${ayat.teksLatin.replace(/'/g, "\\'")}\`)" class="p-2 text-slate-400 hover:text-amber-400 text-sm transition">
              <i class="fa-${isBookmarked ? 'solid text-amber-400' : 'regular'} fa-bookmark"></i>
            </button>
          </div>
        </div>

        <div onclick="this.classList.toggle('revealed')" class="text-right font-arabic text-2xl sm:text-3xl text-slate-100 leading-loose pt-2 select-text ${isHafalanModeOn ? 'hafalan-hidden-arabic' : ''}">
          ${ayat.teksArab}
        </div>

        <p class="text-sm text-emerald-400/90 font-medium italic">${ayat.teksLatin}</p>
        
        <p class="text-sm text-slate-300 leading-relaxed border-t border-slate-700/40 pt-3 ${isHafalanModeOn ? 'hafalan-hidden-translation' : ''}">
          ${ayat.teksIndonesia}
        </p>
      </div>
    `;
  }).join('');
}

// BOOKMARK CATEGORY
function promptBookmarkCategory(key, surahName, verseNumber, latin) {
  const index = bookmarks.findIndex(b => b.key === key);
  if (index > -1) {
    bookmarks.splice(index, 1);
    localStorage.setItem('quran_bookmarks', JSON.stringify(bookmarks));
    updateBookmarkBadge();
    if (currentSurahData) renderVerses(currentSurahData.ayat);
    showToast('Dihapus dari penanda');
  } else {
    pendingBookmarkItem = { key, surahName, verseNumber, latin, surahNumber: currentSurahNumber };
    categoryPickerModal.classList.remove('hidden');
  }
}

function saveBookmarkWithCategory() {
  if (!pendingBookmarkItem) return;
  const selectedCat = customCategoryInput.value.trim() || categorySelectInput.value;
  pendingBookmarkItem.category = selectedCat;
  bookmarks.push(pendingBookmarkItem);
  localStorage.setItem('quran_bookmarks', JSON.stringify(bookmarks));
  categoryPickerModal.classList.add('hidden');
  customCategoryInput.value = '';
  pendingBookmarkItem = null;
  updateBookmarkBadge();
  if (currentSurahData) renderVerses(currentSurahData.ayat);
  showToast(`Disimpan ke folder: ${selectedCat}`);
}

function openBookmarkModal() {
  bookmarkModal.classList.remove('hidden');
  renderBookmarkCategoryFilters();
  renderBookmarkList();
}

function renderBookmarkCategoryFilters() {
  const categories = ['All', ...new Set(bookmarks.map(b => b.category || 'Ayat Favorit'))];
  bookmarkCategoryFilters.innerHTML = categories.map(cat => `
    <button onclick="filterBookmarkList('${cat}')" class="px-3 py-1 rounded-full whitespace-nowrap transition ${selectedBookmarkFilter === cat ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}">
      ${cat}
    </button>
  `).join('');
}

function filterBookmarkList(category) {
  selectedBookmarkFilter = category;
  renderBookmarkCategoryFilters();
  renderBookmarkList();
}

function renderBookmarkList() {
  const filtered = selectedBookmarkFilter === 'All' ? bookmarks : bookmarks.filter(b => (b.category || 'Ayat Favorit') === selectedBookmarkFilter);
  if (filtered.length === 0) {
    bookmarkList.innerHTML = `<p class="text-center text-slate-400 py-6 text-sm">Tidak ada penanda di folder ini.</p>`;
    return;
  }

  bookmarkList.innerHTML = filtered.map(b => `
    <div class="bg-slate-700/50 p-3 rounded-xl flex items-center justify-between gap-3 border border-slate-600/40">
      <div onclick="navigateToBookmark(${b.surahNumber}, ${b.verseNumber})" class="cursor-pointer flex-1">
        <div class="flex items-center gap-2">
          <h4 class="font-bold text-sm text-emerald-400">${b.surahName} : Ayat ${b.verseNumber}</h4>
          <span class="text-[10px] bg-slate-800 text-emerald-400/80 px-2 py-0.5 rounded-full">${b.category || 'Ayat Favorit'}</span>
        </div>
        <p class="text-xs text-slate-300 truncate mt-1">${b.latin}</p>
      </div>
      <button onclick="promptBookmarkCategory('${b.key}', '', 0, '')" class="text-slate-400 hover:text-red-400 p-2 text-xs">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');
}

// DOA HARIAN
function openDoaModal() {
  doaModal.classList.remove('hidden');
  switchDoaTab('doa');
}

function switchDoaTab(tab) {
  if (tab === 'doa') {
    tabDoa.className = 'font-bold text-emerald-400 border-b-2 border-emerald-400 pb-1 text-sm';
    tabAsmaul.className = 'font-bold text-slate-400 border-b-2 border-transparent pb-1 text-sm hover:text-slate-200';
    doaModalContent.innerHTML = DOA_HARIAN_DATA.map(d => {
      const isFav = favoriteDoas.includes(d.id);
      return `
        <div class="bg-slate-700/40 p-4 rounded-xl border border-slate-600/40 space-y-2">
          <div class="flex justify-between items-center">
            <h4 class="font-bold text-sm text-emerald-400">${d.judul}</h4>
            <button onclick="toggleFavoriteDoa(${d.id})" class="text-xs ${isFav ? 'text-amber-400' : 'text-slate-400'}">
              <i class="fa-${isFav ? 'solid' : 'regular'} fa-star"></i>
            </button>
          </div>
          <div class="text-right font-arabic text-xl text-slate-100">${d.arab}</div>
          <p class="text-xs text-emerald-300/80 italic">${d.latin}</p>
          <p class="text-xs text-slate-300">${d.arti}</p>
        </div>
      `;
    }).join('');
  } else {
    tabAsmaul.className = 'font-bold text-emerald-400 border-b-2 border-emerald-400 pb-1 text-sm';
    tabDoa.className = 'font-bold text-slate-400 border-b-2 border-transparent pb-1 text-sm hover:text-slate-200';
    doaModalContent.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      ${ASMAUL_HUSNA_DATA.map(a => `
        <div class="bg-slate-700/40 p-3 rounded-xl border border-slate-600/40 flex items-center justify-between">
          <div>
            <span class="text-[10px] text-emerald-400 font-bold">#${a.no}</span>
            <h4 class="font-bold text-sm text-slate-100">${a.latin}</h4>
            <p class="text-xs text-slate-400">${a.arti}</p>
          </div>
          <div class="font-arabic text-xl text-emerald-400">${a.arab}</div>
        </div>
      `).join('')}
    </div>`;
  }
}

function toggleFavoriteDoa(id) {
  const index = favoriteDoas.indexOf(id);
  if (index > -1) favoriteDoas.splice(index, 1);
  else favoriteDoas.push(id);
  localStorage.setItem('quran_favorite_doas', JSON.stringify(favoriteDoas));
  switchDoaTab('doa');
}

// COUNTDOWN SHOLAT
async function initPrayerCountdown() {
  const cityId = citySelect.value;
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  try {
    const response = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`);
    const result = await response.json();
    if (result.status && result.data && result.data.jadwal) {
      todayPrayerSchedule = result.data.jadwal;
      prayerNextLocation.textContent = result.data.lokasi;
      startPrayerTimer();
    }
  } catch (error) {
    prayerNextName.textContent = "Jadwal Sholat Harian";
  }
}

function startPrayerTimer() {
  if (prayerCountdownInterval) clearInterval(prayerCountdownInterval);
  prayerCountdownInterval = setInterval(() => {
    if (!todayPrayerSchedule) return;
    const now = new Date();
    const times = [
      { name: 'Subuh', time: todayPrayerSchedule.subuh },
      { name: 'Dzuhur', time: todayPrayerSchedule.dzuhur },
      { name: 'Ashar', time: todayPrayerSchedule.ashar },
      { name: 'Maghrib', time: todayPrayerSchedule.maghrib },
      { name: 'Isya', time: todayPrayerSchedule.isya }
    ];

    let nextPrayer = null;
    let targetTime = null;

    for (let p of times) {
      const [h, m] = p.time.split(':');
      const pDate = new Date();
      pDate.setHours(parseInt(h), parseInt(m), 0);
      if (pDate > now) {
        nextPrayer = p;
        targetTime = pDate;
        break;
      }
    }

    if (!nextPrayer) {
      nextPrayer = times[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const [h, m] = nextPrayer.time.split(':');
      tomorrow.setHours(parseInt(h), parseInt(m), 0);
      targetTime = tomorrow;
    }

    const diff = targetTime - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    prayerNextName.textContent = `Menuju Waktu ${nextPrayer.name} (${nextPrayer.time})`;
    prayerTimer.textContent = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, 1000);
}

// COPY & SHARE
function copyVerseText(surah, verseNum, arab, indo) {
  const text = `${surah} Ayat ${verseNum}\n\n${arab}\n\n"${indo}"\n\n- Dibagikan via Web Al-Qur'an Digital`;
  navigator.clipboard.writeText(text).then(() => showToast('Teks ayat berhasil disalin!'));
}

function shareToWhatsApp(surah, verseNum, arab, indo) {
  const text = encodeURIComponent(`*${surah} : Ayat ${verseNum}*\n\n${arab}\n\n_"${indo}"_\n\nDibaca di Al-Qur'an Digital`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

// TAFSIR
async function openTafsirModal(verseNumber) {
  tafsirModal.classList.remove('hidden');
  tafsirTitle.textContent = `Tafsir ${currentSurahData.namaLatin} : Ayat ${verseNumber}`;
  tafsirContent.innerHTML = `<div class="text-center text-slate-400 py-6"><i class="fa-solid fa-spinner fa-spin text-emerald-400"></i> Memuat tafsir...</div>`;

  try {
    if (!tafsirDataCache[currentSurahNumber]) {
      const response = await fetch(`https://equran.id/api/v2/tafsir/${currentSurahNumber}`);
      const result = await response.json();
      if (result.code === 200) tafsirDataCache[currentSurahNumber] = result.data.tafsir;
    }
    const tafsirList = tafsirDataCache[currentSurahNumber];
    const ayatTafsir = tafsirList.find(t => t.ayat === verseNumber);
    if (ayatTafsir) tafsirContent.innerHTML = `<p class="leading-relaxed text-slate-200">${ayatTafsir.teks}</p>`;
  } catch (error) {
    tafsirContent.innerHTML = `<p class="text-red-400 text-center">Gagal memuat data tafsir.</p>`;
  }
}

// RECORD VOICE
async function toggleRecordVerse(verseKey) {
  if (recordingVerseKey === verseKey) {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    recordingVerseKey = null;
  } else {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      recordingVerseKey = verseKey;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          userRecordings[verseKey] = reader.result;
          localStorage.setItem('quran_user_recordings', JSON.stringify(userRecordings));
          if (currentSurahData) renderVerses(currentSurahData.ayat);
          showToast('Rekaman suara disimpan!');
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      if (currentSurahData) renderVerses(currentSurahData.ayat);
    } catch (err) {
      alert("Gagal mengakses mikrofon.");
      recordingVerseKey = null;
    }
  }
}

// AUDIO PLAYER
function playVerseAudio(index) {
  if (!currentSurahData) return;
  const ayat = currentSurahData.ayat[index];
  const verseKey = `${currentSurahNumber}:${ayat.nomorAyat}`;
  
  let audioUrl = userRecordings[verseKey] ? userRecordings[verseKey] : (ayat.audio[selectedQari] || ayat.audio['05']);
  let titleSource = userRecordings[verseKey] ? 'Suara Rekaman Anda' : 'Qari Pilihan';

  saveLastRead(currentSurahNumber, currentSurahData.namaLatin, ayat.nomorAyat, ayat.teksLatin);

  if (activeAudio.verseKey === verseKey && activeAudio.isPlaying) {
    activeAudio.element.pause();
    activeAudio.isPlaying = false;
    audioPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  } else {
    activeAudio.url = audioUrl;
    activeAudio.verseKey = verseKey;
    activeAudio.verseIndex = index;
    activeAudio.element.src = audioUrl;
    activeAudio.element.playbackRate = audioSpeeds[currentSpeedIndex];
    activeAudio.element.play();
    activeAudio.isPlaying = true;

    audioTitle.textContent = `${currentSurahData.namaLatin} : Ayat ${ayat.nomorAyat}`;
    audioSubtitle.textContent = `Sumber: ${titleSource} • Auto-Play: ${isAutoPlayOn ? 'On' : 'Off'}`;
    audioPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    audioBar.classList.remove('translate-y-full');
  }

  updatePlayingVerseUI(activeAudio.isPlaying ? verseKey : null);
}

function playNextAyatAudio() {
  if (!currentSurahData) return;
  const nextIndex = activeAudio.verseIndex + 1;
  if (nextIndex < currentSurahData.ayat.length) playVerseAudio(nextIndex);
  else stopAudio();
}

function playPreviousAyatAudio() {
  if (!currentSurahData) return;
  const prevIndex = activeAudio.verseIndex - 1;
  if (prevIndex >= 0) playVerseAudio(prevIndex);
}

function playFullSurahAudio() {
  if (!currentSurahData) return;
  const audioUrl = currentSurahData.audioFull[selectedQari] || currentSurahData.audioFull['05'];
  activeAudio.url = audioUrl;
  activeAudio.verseKey = 'full';
  activeAudio.element.src = audioUrl;
  activeAudio.element.playbackRate = audioSpeeds[currentSpeedIndex];
  activeAudio.element.play();
  activeAudio.isPlaying = true;

  audioTitle.textContent = `${currentSurahData.namaLatin} (Full Murottal)`;
  audioSubtitle.textContent = 'Pemutaran Penuh per Surah';
  audioPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  audioBar.classList.remove('translate-y-full');
}

function toggleAudioPlay() {
  if (!activeAudio.url) return;
  if (activeAudio.isPlaying) {
    activeAudio.element.pause();
    activeAudio.isPlaying = false;
    audioPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  } else {
    activeAudio.element.play();
    activeAudio.isPlaying = true;
    audioPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  }
}

function stopAudio() {
  activeAudio.element.pause();
  activeAudio.isPlaying = false;
  activeAudio.url = null;
  activeAudio.verseKey = null;
  audioBar.classList.add('translate-y-full');
  updatePlayingVerseUI(null);
}

function toggleAutoPlay() {
  isAutoPlayOn = !isAutoPlayOn;
  autoplayStatus.textContent = isAutoPlayOn ? 'On' : 'Off';
  autoplayToggleBtn.className = isAutoPlayOn 
    ? 'text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 transition flex items-center gap-1.5' 
    : 'text-xs px-2.5 py-1.5 rounded-lg bg-slate-700/60 text-slate-300 hover:text-emerald-400 transition flex items-center gap-1.5';
}

function updatePlayingVerseUI(activeKey) {
  if (!versesContainer.children) return;
  const verses = versesContainer.children;
  for (let verse of verses) {
    verse.classList.remove('border-emerald-500', 'shadow-lg', 'shadow-emerald-500/10');
  }
  if (activeKey && activeKey !== 'full') {
    const verseNum = activeKey.split(':')[1];
    const el = document.getElementById(`verse-${verseNum}`);
    if (el) {
      el.classList.add('border-emerald-500', 'shadow-lg', 'shadow-emerald-500/10');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

function showSurahList() {
  surahDetailView.classList.add('hidden');
  surahListView.classList.remove('hidden');
  currentSurahNumber = null;
  currentSurahData = null;
  checkLastReadUI();
}

function showSurahDetailView() {
  surahListView.classList.add('hidden');
  surahDetailView.classList.remove('hidden');
}

function saveLastRead(surahNum, surahName, verseNum, latin) {
  const timestamp = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  lastRead = { surahNum, surahName, verseNum, latin, timestamp };
  localStorage.setItem('quran_last_read', JSON.stringify(lastRead));
  checkLastReadUI();
}

function checkLastReadUI() {
  if (!lastRead) {
    lastReadCard.classList.add('hidden');
    return;
  }
  lastReadCard.classList.remove('hidden');
  lrTitle.textContent = `${lastRead.surahName} : Ayat ${lastRead.verseNum}`;
  lrSubtitle.textContent = `"${lastRead.latin}"`;
  lrTime.textContent = lastRead.timestamp;

  lrResumeBtn.onclick = () => {
    loadSurahDetail(lastRead.surahNum).then(() => {
      setTimeout(() => {
        const el = document.getElementById(`verse-${lastRead.verseNum}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    });
  };
}

function updateBookmarkBadge() {
  bookmarkCountEl.textContent = bookmarks.length;
}

async function openSholatModal() {
  sholatModal.classList.remove('hidden');
  fetchJadwalSholat();
}

async function fetchJadwalSholat() {
  const cityId = citySelect.value;
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  sholatTimesGrid.innerHTML = `<div class="col-span-2 text-center text-slate-400 py-6"><i class="fa-solid fa-spinner fa-spin text-emerald-400"></i> Memuat jadwal sholat...</div>`;

  try {
    const response = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`);
    const result = await response.json();
    if (result.status && result.data && result.data.jadwal) {
      const jadwal = result.data.jadwal;
      sholatDateInfo.textContent = `${result.data.lokasi}, ${jadwal.tanggal}`;
      sholatTimesGrid.innerHTML = `
        <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-700 flex justify-between items-center"><span class="text-xs text-slate-400">Imsak</span><span class="font-bold text-emerald-400 text-sm">${jadwal.imsak}</span></div>
        <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-700 flex justify-between items-center"><span class="text-xs text-slate-400">Subuh</span><span class="font-bold text-emerald-400 text-sm">${jadwal.subuh}</span></div>
        <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-700 flex justify-between items-center"><span class="text-xs text-slate-400">Dzuhur</span><span class="font-bold text-emerald-400 text-sm">${jadwal.dzuhur}</span></div>
        <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-700 flex justify-between items-center"><span class="text-xs text-slate-400">Ashar</span><span class="font-bold text-emerald-400 text-sm">${jadwal.ashar}</span></div>
        <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-700 flex justify-between items-center"><span class="text-xs text-slate-400">Maghrib</span><span class="font-bold text-emerald-400 text-sm">${jadwal.maghrib}</span></div>
        <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-700 flex justify-between items-center"><span class="text-xs text-slate-400">Isya</span><span class="font-bold text-emerald-400 text-sm">${jadwal.isya}</span></div>
      `;
    }
  } catch (error) {
    sholatTimesGrid.innerHTML = `<div class="col-span-2 text-center text-red-400 py-4">Gagal memuat jadwal sholat.</div>`;
  }
}