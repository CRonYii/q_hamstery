import { Modal } from "antd"
import { useAppDispatch, useAppSelector } from "../../../app/hook"
import { bundleActions, bundleSelector } from "./bundleSlice"
import { TVSeasonBundleUpdater } from "./TvBundleDownloadPage"

const GlobalSeasonBundleModal: React.FC = () => {
    const dispatch = useAppDispatch()
    const bundle = useAppSelector(bundleSelector)

    return <Modal
        title={"Update Bundle"}
        style={{ minWidth: '60vw' }}
        maskClosable={false}
        open={bundle.open}
        onCancel={() => dispatch(bundleActions.closeBundle())}
        footer={null}
    >
        {bundle.download && bundle.season ? <TVSeasonBundleUpdater download={bundle.download} season={bundle.season} /> : null}
    </Modal>

}

export default GlobalSeasonBundleModal