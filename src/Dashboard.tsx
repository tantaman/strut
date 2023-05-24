import { useNavigate } from "react-router-dom";
import useMetaDBID from "./components/metadb/useMetaDBID.js";
import { DBID } from "./components/db/DBFactory";
import DBProvider from "./components/db/DBProvider";

import metaSchema from "./schemas/meta.mjs";
import OpenDeckDlg from "./components/open/OpenDeckDlg.js";
import metaMutations from "./domain/metaMutations.js";
import { CtxAsync } from "@vlcn.io/react";
import { bytesToHex } from "@vlcn.io/direct-connect-common";
import { endpoints } from "./SyncEndpoints.js";

export default function Dashboard() {
  const metaDBID = useMetaDBID();
  if (metaDBID === null) {
    return <div>Awaiting user</div>;
  }
  return <UserReady metadbid={metaDBID} />;
}

function UserReady({ metadbid }: { metadbid: DBID }) {
  const navigate = useNavigate();
  const onNewDeck = async (ctx: CtxAsync) => {
    const [dbid, deckid] = await metaMutations.newDeck(ctx);
    navigate(`/create/${bytesToHex(dbid)}/${deckid}`);
  };
  return (
    <DBProvider dbid={metadbid} schema={metaSchema} endpoints={endpoints}>
      <OpenDeckDlg onNewDeck={onNewDeck} />
    </DBProvider>
  );
}
