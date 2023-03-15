import * as dotenv from "dotenv";
import faunadb from 'faunadb';
import { Document, Reference } from "./types";

dotenv.config();

const q = faunadb.query

let client: faunadb.Client
const connect = () => {
    if (client) return client

    if (!process.env.FAUNADB_SERVER_SECRET) {
        console.log('Missing FAUNADB_SECRET')
        return;
    }

    client = new faunadb.Client({
        secret: process.env.FAUNADB_SERVER_SECRET
    })

    return client;
}


const database = {
    find: async function(index: string, terms: string[]): Promise<Document | null> {
        const client = connect()
        if (!client) {
            return null
        }

        return client.query(
            q.Let(
                {
                    match: q.Match(q.Index(index), terms),
                },
                q.If(
                    q.Exists(q.Var('match')),
                    q.Get(q.Var('match')),
                    null
                )
          )
        )
    },

    findByID: async function(ref: Reference): Promise<Document | null> {
        const client = connect()
        if (!client) {
            return null
        }

        return client.query(
            q.If(
                q.Exists(q.Ref(ref)),
                q.Get(q.Ref(ref)),
                null
              ),
        )
    },

    insertOne: async function(collection: string, data: any): Promise<Document | null> {
        const client = connect()
        if (!client) {
            return null
        }
        return client.query(
            q.Create(
                q.Collection(collection),
                { data }
            )
        )
    },

    updateOne: async function(ref: Reference, data: any): Promise<Document | null> {
        const client = connect()
        if (!client) {
            return null
        }

        return client.query(
            q.If(
                q.Exists(q.Ref(ref)),
                q.Update(q.Ref(ref), {data}),
                null
              ),
        )
    },

    deleteOne: async function(ref: Reference): Promise<Document | null> {
        const client = connect()
        if (!client) {
            return null
        }

        return client.query(
            q.If(
                q.Exists(q.Ref(ref)),
                q.Delete(q.Ref(ref)),
                null
              ),
        )
    },

    // Only for dev
    deleteAll: async function(collection: string) {
        const client = connect()
        if (!client) {
            return null
        }

        return client.query(
            q.Map(
                q.Paginate(q.Documents(q.Collection(collection))),
                q.Lambda('ref', q.Delete(q.Var('ref')))
            )
          )
    }
};

export default database;