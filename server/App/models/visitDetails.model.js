const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const visitSchema = new Schema(
  {

    consultationBillNumber: { type: String, sparse: true }, // ✅ NEW
    therapyBillNumber: { type: String, sparse: true },      // ✅ NEW
    prakritiBillNumber: { type: String, sparse: true },     // ✅ NEW
    patientId: { type: Schema.Types.ObjectId, ref: "Enquiry", required: true },
    date: { type: String, required: true },
    department: { type: String},
    appointment: { type: String, required: true },
    sponsor: { type: String},
    consultationamount: { type: Number, default: 0 },
    prakritiparikshanamount: { type: Number, default: 0 },

    therapies: [
      {
        name: { type: String, required: true },
        sessions: { type: Number, default: 1 },
        amount: { type: Number, default: 0 },
      },
    ],

    medicines: [
      {
        subMedicines: [
          {
            name: { type: String, required: true },
            quantity: { type: String, required: true },
          },
        ],
        dose: { type: String, required: true },
        intake: { type: String, required: true },
        timings: [{ type: String, required: true }],
        duration: { type: String, required: true },
        otherTiming: { type: String },
      },
    ],

    others: { type: String },
    othersamount: { type: Number, default: 0 },
    observation: { type: String },

    status: {
      type: String,
      enum: ["pending", "done"],
      default: "pending",
    },
    therapyWithAmount: [
      {
        name: String,
        receivedAmount: Number,
      },
    ],
    discounts: {
      consultation: {
        percentage: { type: Number },
        approvedBy: { type: String },
      },
      prakritiparikshan: {
        percentage: { type: Number },
        approvedBy: { type: String },
      },
      therapies: [
        {
          name: { type: String },
          percentage: { type: Number },
          approvedBy: { type: String },
        },
      ],
      others: {
        percentage: { type: Number },
        approvedBy: { type: String },
      },
    },

    rogParikshan: {
      stool: { type: String },
      urine: { type: String },
      appetite: { type: String },
      sleep: { type: String },
      tongue: { type: String },
    },

    nadiParikshaFindings: { type: String },
    knownCaseOf: { type: String },
    otherObservations: { type: String },

    balance: {
      consultation: { type: Number, default: 0 },
      prakritiparikshan: { type: Number, default: 0 },
      therapies: [
        {
          name: { type: String },
          balance: { type: Number },
        },
      ],
      others: [
        {
          purpose: { type: String },
          balance: { type: Number },
        },
      ],
    },
  },
  { timestamps: true }
);

const visitModel = mongoose.model("Visit", visitSchema);
module.exports = visitModel;
