
const emailReciever = 'larz@gmail.com';

const sel_region = document.getElementById('sel_region');
sel_region.selectedIndex = 1

const sel_country = document.getElementById('sel_country');
sel_country.selectedIndex = 27

const source_modis = document.getElementById('source_modis');
const source_snpp = document.getElementById('source_snpp');
const source_noaa20 = document.getElementById('source_noaa20');

source_modis.checked = true;
source_snpp.checked = true;
source_noaa20.checked = true;


const fromDate = document.getElementById('fromDate');
const toDate = document.getElementById('toDate');
toDate.value = new Date().toISOString().slice(0, 10);

const output_format = document.getElementById('output_format');
output_format.selectedIndex = 1

const email2 = document.getElementById('email2');
email2.value = emailReciever;
const confirm_email = document.getElementById('confirm_email');
confirm_email.checked = true;

const btn_create = document.getElementById('btn_create');
btn_create.onclick();



const ui2 = document.querySelector('.UI .aDP .ae4.aDM.nH.oy8Mbf.aAF');
ui2.childNodes[2].childNodes[0].childNodes[0].children[1].children[0].click()