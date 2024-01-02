require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = `${(process.env.NODE_ENV !== 'production')? process.cwd():''}${process.env.SQLITE_DB_PATH}`

const databasePath = path.dirname(DBSOURCE);
if (!fs.existsSync(databasePath)){
    fs.mkdirSync(databasePath, {recursive: true});
}

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQlite database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS bindreports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_type TEXT,
        start_datetime TEXT,
        end_datetime TEXT,
        status TEXT,
        parameters TEXT,
        job_id INTEGER,
        extension_file TEXT,
        failed_reason TEXT,
        fileOutput TEXT,
        createBy TEXT,
        merge_job_id INTEGER DEFAULT null,
        final_job_id INTEGER DEFAULT null
        )`);

    db.run(`CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        type TEXT,
        linkTemplate TEXT,
        linkFileData TEXT,
        extensionFile TEXT,
        description TEXT
    )`);

});

const migrateDefault = async() => {
    const data = [
        ['6582a8822f834ed8271122a7', 'ap203_form50_original', 'https://drive.google.com/file/d/1Tgkn-zXCGwGFSNi2THWx4XmAVwE7hm6G/view?usp=drive_link', 'https://drive.google.com/file/d/1akFSZQOyk-XavCeu7Xi2bs0XeQfc6K3a/view?usp=drive_link', 'pdf', 'Generate pdf online from link google drive.'],
        ['6585710d1422d8611dd58163', 'icetax-form', 'https://drive.google.com/file/d/1CeXeSFKnK_Pw_WsoYpwpUR7ewhk0fAu7/view?usp=drive_link', 'https://drive.google.com/file/d/1T9A42OKbhx2cFEybonenSwf270PJFOg9/view?usp=drive_link', 'xlsx', 'Generate excel online from link google drive.'],
        ['6585880848712060136f136e', 'myTemplate', 'https://drive.google.com/file/d/1btb4Osz5U-Nx1RlK33t_C-obr_I1zxmb/view?usp=sharing', 'https://drive.google.com/file/d/1FwaIKeS2ss9EakNE-8O2qbrO9fthvNPk/view?usp=sharing', 'docx', 'Generate word online from link google drive.'],
        ['6589993d7da1398cd6b50510', 'ใบสั่งซื้อ', 'https://drive.google.com/file/d/1xfD_Ec617visGs75vUD6n3Jf4Iv3JVzO/view?usp=sharing', 'https://drive.google.com/file/d/1kulgm_cXnOR3z1s5DPTMwoDNPeVixbgg/view?usp=sharing', 'pdf', 'Generate pdf online from link google drive.']
    ];

    let stmt = db.prepare("INSERT INTO templates (id, type, linkTemplate, linkFileData, extensionFile, description) VALUES(?,?,?,?,?,?)");
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if(!await dbGetOnce("SELECT id FROM templates WHERE id = ?",[row[0]])){
            stmt.run(row[0], row[1], row[2], row[3], row[4], row[5]);
        }
    }
    stmt.finalize();
};

const sqlInParam =(sql, arr) => sql.replace('?#', arr.map(()=> '?' ).join(','));

const dbGetOnce = (sql, params = undefined) => {
    return new Promise((resolve, reject) => {
        if(params !== undefined){
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        }else{
            db.get(sql, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        }
    });
};

const dbGetAll = (sql, params = undefined) => {
    return new Promise((resolve, reject) => {
        if(params !== undefined){
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }else{
            db.all(sql, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }
    });
};

module.exports = {db, sqlInParam, dbGetOnce, dbGetAll, migrateDefault};