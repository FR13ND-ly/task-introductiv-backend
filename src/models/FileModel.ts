import { Schema, Types, model } from "mongoose"

const FileSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    parent: {
        type: Types.ObjectId,
        ref: 'File'
    },
    isFolder: {
        type: Boolean,
        default: false
    },
    path: { 
        type: String,
        required: true
    },
    metadata: {
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }
})

export const FileModel = model("File", FileSchema)