import { useNavigate } from "react-router-dom";
import useMetaDBID from "./components/metadb/useMetaDBID.js";

import metaSchema from "./schemas/meta.mjs";
import OpenDeckDlg from "./components/open/OpenDeckDlg.js";
import metaMutations from "./domain/metaMutations.js";
import { CtxAsync, DBProvider } from "@vlcn.io/react";
import { bytesToHex } from "@vlcn.io/ws-common";

export default function Dashboard() {
  const metaDBID = useMetaDBID();
  if (metaDBID === null) {
    return <div>Awaiting user</div>;
  }
  return <UserReady metadbid={metaDBID} />;
}

function UserReady({ metadbid }: { metadbid: string }) {
  const navigate = useNavigate();
  const onNewDeck = async (ctx: CtxAsync) => {
    const [dbid, deckid] = await metaMutations.newDeck(ctx);
    navigate(`/create/${bytesToHex(dbid)}/${deckid}`);
  };
  return (
    <DBProvider
      dbname={metadbid}
      schema={metaSchema}
      Render={() => <OpenDeckDlg onNewDeck={onNewDeck} />}
    ></DBProvider>
  );
}
