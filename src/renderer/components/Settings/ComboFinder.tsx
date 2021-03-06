import * as React from "react";

import { useDispatch, useSelector } from "react-redux";
import { Button, Checkbox, Form, Icon, Progress } from "semantic-ui-react";

import { fileProcessor, FindComboOption, ProcessResult } from "@/lib/fileProcessor";
import { loadFileInDolphin, notify, openComboInDolphin } from "@/lib/utils";
import { Dispatch, iRootState } from "@/store";
import { secondsToString } from "common/utils";
import { InlineDropdown } from "../Misc/InlineInputs";
import { FileInput } from "../Misc/Misc";
import { ProcessSection } from "../Misc/ProcessSection";
import { RenameFiles } from "./RenameFiles";

const isWindows = process.platform === "win32";

export const ComboFinder: React.FC<{}> = () => {
    const { comboFinderPercent, comboFinderLog, comboFinderProcessing } = useSelector((state: iRootState) => state.tempContainer);
    const { openCombosWhenDone, filesPath, combosFilePath, includeSubFolders, deleteFilesWithNoCombos,
        renameFiles, findCombos, findComboOption, renameFormat } = useSelector((state: iRootState) => state.filesystem);
    const dispatch = useDispatch<Dispatch>();
    const setRenameFormat = (format: string) => dispatch.filesystem.setRenameFormat(format);
    const setRenameFiles = (checked: boolean) => dispatch.filesystem.setRenameFiles(checked);
    const setFindCombos = (checked: boolean) => dispatch.filesystem.setFindCombos(checked);
    const setFindComboOption = (val: FindComboOption) => dispatch.filesystem.setFindComboOption(val);
    const onSubfolder = (checked: boolean) => dispatch.filesystem.setIncludeSubFolders(checked);
    const onSetDeleteFiles = (checked: boolean) => dispatch.filesystem.setFileDeletion(checked);
    const onSetOpenCombosWhenDone = (checked: boolean) => dispatch.filesystem.setOpenCombosWhenDone(checked);
    const setCombosFilePath = (p: string) => dispatch.filesystem.setCombosFilePath(p);
    const setFilesPath = (p: string) => dispatch.filesystem.setFilesPath(p);
    const findAndWriteCombos = async () => {
        dispatch.tempContainer.setPercent(0);
        dispatch.tempContainer.setComboFinderProcessing(true);
        console.log(`finding combos from the slp files in ${filesPath} ${includeSubFolders && "and all subfolders"} and saving to ${combosFilePath}`);
        const callback = (i: number, total: number, filename: string, r: ProcessResult): void => {
            dispatch.tempContainer.setPercent(Math.round((i + 1) / total * 100));
            if (findCombos) {
                if (r.fileDeleted) {
                    dispatch.tempContainer.setComboLog(`Deleted ${filename}`);
                } else {
                    dispatch.tempContainer.setComboLog(`Found ${r.numCombos} combos in: ${r.newFilename || filename}`);
                }
            } else if (renameFiles && r.newFilename) {
                dispatch.tempContainer.setComboLog(`Renamed ${filename} to ${r.newFilename}`);
            }
        };
        const result = await fileProcessor.process({
            filesPath,
            includeSubFolders,
            findCombos,
            outputFile: combosFilePath,
            deleteZeroComboFiles: deleteFilesWithNoCombos,
            findComboOption,
            renameTemplate: renameFormat,
            renameFiles,
        }, callback);
        const timeTakenStr = secondsToString(result.timeTaken);
        const numCombos = result.combosFound;
        console.log(`finished generating ${numCombos} combos in ${timeTakenStr}`);
        let message = `Processed ${result.filesProcessed} files in ${timeTakenStr}`;
        if (findCombos) {
            message += ` and wrote ${numCombos} combos to: ${combosFilePath}`;
        }
        dispatch.tempContainer.setComboFinderProcessing(false);
        dispatch.tempContainer.setPercent(100);
        dispatch.tempContainer.setComboLog(message);
        notify(message, `Combo Processing Complete`);
        if (isWindows && openCombosWhenDone) {
            // check if we want to open the combo file after generation
            openComboInDolphin(combosFilePath);
        }
    };
    const complete = comboFinderPercent === 100;
    const processBtnDisabled = (!findCombos && !renameFiles) || !combosFilePath;

    const options = [
        {
            key: "onlyCombos",
            value: FindComboOption.OnlyCombos,
            text: "combos",
        },
        {
            key: "onlyConversions",
            value: FindComboOption.OnlyConversions,
            text: "conversions",
        },
    ];

    return (
        <div>
            <Form>
                <h2>Replay Processor</h2>
                <Form.Field>
                    <label>SLP Replay Directory</label>
                    <FileInput
                        value={filesPath}
                        onChange={setFilesPath}
                        directory={true}
                    />
                </Form.Field>
                <Form.Field>
                    <Checkbox
                        label="Include subfolders"
                        checked={includeSubFolders}
                        onChange={(_, data) => onSubfolder(Boolean(data.checked))}
                    />
                </Form.Field>
                <ProcessSection
                    label="Find Combos"
                    open={findCombos}
                    onOpenChange={setFindCombos}
                >
                    <div style={{paddingBottom: "10px"}}>
                        <span>Search replay directory for </span>
                        <InlineDropdown
                            value={findComboOption}
                            onChange={setFindComboOption}
                            options={options}
                        />
                    </div>
                    <Form.Field>
                        <label>Output File</label>
                        <FileInput
                            value={combosFilePath}
                            onChange={setCombosFilePath}
                            saveFile={true}
                            fileTypeFilters={[
                                { name: "JSON files", extensions: ["json"] }
                            ]}
                        />
                    </Form.Field>
                    <Form.Field>
                        <Checkbox
                            label="Delete files with no combos"
                            checked={deleteFilesWithNoCombos}
                            onChange={(_, data) => onSetDeleteFiles(Boolean(data.checked))}
                        />
                    </Form.Field>
                    {isWindows && <Form.Field>
                        <Checkbox
                            label="Load output file into Dolphin when complete"
                            checked={openCombosWhenDone}
                            onChange={(_, data) => onSetOpenCombosWhenDone(Boolean(data.checked))}
                        />
                    </Form.Field>}
                </ProcessSection>

                <ProcessSection
                    label="Rename Files"
                    open={renameFiles}
                    onOpenChange={setRenameFiles}
                >
                    <RenameFiles value={renameFormat} onChange={setRenameFormat} />
                </ProcessSection>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    {comboFinderProcessing ?
                        <Button negative={true} type="button" onClick={() => fileProcessor.stop()}>
                            <Icon name="stop" />
                            Stop processing
                    </Button>
                        :
                        <Button primary={true} type="button" onClick={() => findAndWriteCombos().catch(console.error)} disabled={processBtnDisabled}>
                            <Icon name="fast forward" />
                            Process replays
                    </Button>
                    }
                    {isWindows && <Button type="button" onClick={() => loadFileInDolphin().catch(console.error)}>
                        Load a file into Dolphin
                    </Button>}
                </div>
            </Form>
            <div style={{ padding: "10px 0" }}>
                {(comboFinderProcessing || complete) &&
                    <Progress progress={true} percent={comboFinderPercent} success={complete}>{comboFinderLog}</Progress>
                }
            </div>
        </div>
    );
};
