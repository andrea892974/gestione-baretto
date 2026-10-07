const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'utente',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'baretto',
  waitForConnections: true,
  connectionLimit: 10
};

const pool = mysql.createPool(dbConfig);

const tableStatements = [
  `CREATE TABLE IF NOT EXISTS prodotti (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codice VARCHAR(30) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descrizione VARCHAR(255) NULL,
    categoria VARCHAR(50) NOT NULL DEFAULT 'Generico',
    prezzo DECIMAL(10, 2) NOT NULL,
    quantita INT NOT NULL DEFAULT 0,
    attivo BOOLEAN NOT NULL DEFAULT TRUE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS personale (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(60) NOT NULL,
    cognome VARCHAR(60) NOT NULL,
    email VARCHAR(100) NULL UNIQUE,
    telefono VARCHAR(30) NULL,
    ruolo VARCHAR(60) NOT NULL DEFAULT 'Barista',
    attivo BOOLEAN NOT NULL DEFAULT TRUE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS ordini (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(30) NOT NULL UNIQUE,
    data_ordine DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_prodotto INT NOT NULL,
    id_personale INT NOT NULL,
    cliente VARCHAR(100) NOT NULL,
    stato ENUM('pendente', 'in_corso', 'confermato', 'annullato', 'completato') NOT NULL DEFAULT 'pendente',
    totale DECIMAL(10, 2) NOT NULL,
    nota VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ordini_prodotto FOREIGN KEY (id_prodotto)
      REFERENCES prodotti (id),
    CONSTRAINT fk_ordini_personale FOREIGN KEY (id_personale)
      REFERENCES personale (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
];

async function initializeDatabase() {
  const connection = await pool.getConnection();

  try {
    await connection.query('CREATE DATABASE IF NOT EXISTS `baretto` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await connection.query(`USE \`baretto\``);

    for (const statement of tableStatements) {
      await connection.query(statement);
    }
  } finally {
    connection.release();
  }
}

async function closeDatabase() {
  await pool.end();
}

async function start() {
  try {
    await initializeDatabase();
    console.log(`Connesso al database ${dbConfig.database} stabilita.`);
  } catch (error) {
    console.error('Errore durante la connessione al database:', error.message);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
    process.exit(process.exitCode || 0);
  }
}

if (require.main === module) {
  start();
}

module.exports = { dbConfig, initializeDatabase, closeDatabase, pool };
