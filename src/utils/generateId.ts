import counterModel from "../models/counterModel";


type CounterType = 'user' | 'order' | 'product' | 'invoice' | 'assessment' | 'question' | 'category' | 'session' | 'userAssessment';

export const generateUniqueId = async (type: CounterType): Promise<number> => {
    const counter = await counterModel.findOneAndUpdate(
        { counterId: type },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
    );

    if (!counter) {
        throw new Error(`Failed to generate ID for ${type}`);
    }

    return counter.sequence;  // Returns: 1, 2, 3, 4...
};

















// export const generateUniqueId = async (model, prefix) => {
//     try {
//         let lastEntry = await model.findOne().sort({ id: -1 });

//         let newUniqueId = "";
//         if (lastEntry && lastEntry.id) {
//             const lastNumericPart = parseInt(lastEntry.id.replace(prefix, ""), 10);
//             const nextId = lastNumericPart + 1;
//             newUniqueId = `${prefix}${String(nextId).padStart(4, "0")}`;
//         } else {
//             newUniqueId = `${prefix}0001`;
//         }
//         console.log("newUniqueId ==>", newUniqueId);
//         return newUniqueId;
//     } catch (error) {
//         console.error(`Error generating unique ID for ${prefix}:`, error);
//         throw error;
//     }
// };