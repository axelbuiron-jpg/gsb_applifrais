const TARIFS = {
  KM: 0.62,
  EF: 110,
  NUI: 80,
  REP: 25
};

module.exports = {
  montant(code) {
    return TARIFS[code] || 0;
  }
};