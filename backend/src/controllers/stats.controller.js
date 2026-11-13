const data = await Fiche.aggregate([
    { $match: { etat: { $in: ["VA", "MP", "RB"] } } }, // ① ne garder que les fiches validées+
    { $unwind: "$lignesForfait" }, // ② "déplier" : 1 ligne → 1 document
    { $lookup: { // ③ JOINDRE la collection barème
        from: "typesFrais", localField: "lignesForfait.codeType",
        foreignField: "code", as: "type" } },
    { $unwind: "$type" },
    { $group: { // ④ REGROUPER et calculer
        _id: "$type.libelle",
        total: { $sum: { $multiply: ["$lignesForfait.quantite", "$type.montant"] } } } },
    { $sort: { total: -1 } }, // ⑤ trier du plus gros au plus petit
]);