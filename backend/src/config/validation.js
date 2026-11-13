await db.command({
    collMod: "fiches",
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["visiteur", "mois", "etat"],
            properties: {
                mois: { bsonType: "string", pattern: "^[0-9]{4}-[0-9]{2}$" },
                etat: { enum: ["CR", "CL", "VA", "MP", "RB"] },
            },
        },
    },
    validationLevel: "strict",
});
