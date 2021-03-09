import React, { useState, useEffect } from "react";
import { useImmer } from "use-immer";
import styled from "styled-components";
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Modal,
  Snackbar,
  Switch,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
} from "@material-ui/core";
import {
  Close as CloseIcon,
  Settings as SettingsIcon,
} from "@material-ui/icons";
import CSVReader from "react-csv-reader";
import { CanvasJS, CanvasJSChart } from "canvasjs-react-charts";
import { fft } from "fft-js";
import Delay from "react-delay";

import { getCookie, setCookie } from "./cookieHelper";

const MyBody = styled.div`
  background: linear-gradient(#c6d5e4, #69737b);
  overflow: auto;
`;

const MyToolbar = styled(Toolbar)`
  background: linear-gradient(#bbb, #888);
  box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2),
    0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12);
  min-height: 48px !important;
`;

const MyContainer = styled(Container).attrs({ maxWidth: "lg", fixed: true })`
  height: calc(100vh - 48px);
  margin-top: 48px;
  text-align: center;
`;

const EditForm = styled.div`
  margin: 100px auto;
  overflow: auto;
  width: 500px;

  .editBox {
    background: white;
  }

  .editTitle {
    display: block;
    margin-bottom: 10px;
  }

  .editFields {
    align-items: center;
    display: flex;
    justify-content: space-evenly;
    margin-top: 30px;
  }
`;

CanvasJS.addColorSet("materialColorSet", [
  "#ff1744",
  "#d500f9",
  "#3d5afe",
  "#00b0ff",
  "#1de9b6",
  "#33691e",
]);

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const handleSetModalOpen = () => setModalOpen((open) => !open);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const handleSnackbarClose = (_, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setSnackbarOpen(false);
  };

  const [tab, setTab] = useState(0);
  const handleSetTab = (_, newTab) => setTab(newTab);

  const [isFFT, setIsFFT] = useState(false);
  const handleSetIsFFT = () => setIsFFT((now) => !now);

  const [waveInfo, setWaveInfo] = useImmer({
    name: Array.from({ length: 6 }, () => ["", ""]),
    ab: Array.from({ length: 6 }, () => ["", ""]),
  });

  const [file, setFile] = useImmer({
    data: Array.from({ length: 6 }, (_, index) => ({
      dataPoints: [],
      originalData: [],
      index,
      name: "",
      showInLegend: true,
      type: "spline",
      visible: true,
    })),
    info: null,
    axisX: null,
    ab: Array.from({ length: 6 }, () => ["", ""]),
    fft_real: Array.from({ length: 6 }, (_, index) => ({
      dataPoints: [],
      index,
      name: "",
      showInLegend: true,
      type: "spline",
      visible: true,
    })),
    fft_image: Array.from({ length: 6 }, (_, index) => ({
      dataPoints: [],
      index,
      name: "",
      showInLegend: true,
      type: "spline",
      visible: true,
    })),
  });

  useEffect(() => {
    let waveAnalysisInfo = JSON.parse(getCookie());
    if (waveAnalysisInfo === null) {
      const tmpInfo = {
        name: ["V1", "V2", "V3", "A1", "A2", "A3"],
        ab: Array.from({ length: 6 }, () => [1, 0]),
      };
      setCookie("WaveAnalysisInfo", JSON.stringify(tmpInfo), 30);
      waveAnalysisInfo = tmpInfo;
    }

    setFile((f) => {
      waveAnalysisInfo.name.forEach((name, index) => {
        f.data[index].name = name;
        f.fft_real[index].name = name;
        f.fft_image[index].name = name;
      });

      waveAnalysisInfo.ab.forEach(([a, b], index) => {
        f.ab[index] = [a, b];
      });
    });

    setWaveInfo(() => waveAnalysisInfo);
  }, []);

  const handleSetFile = (data, info) => {
    setFile((f) => {
      f.info = info;

      f.data.forEach((ff) => {
        ff.dataPoints = [];
        ff.originalData = [];
      });

      data.slice(2).forEach((d, index) => {
        if (d.length === 7) {
          d.slice(1).forEach((value, idx) => {
            f.data[idx].dataPoints.push({
              x: index + 1,
              y:
                parseFloat(waveInfo.ab[idx][0]) * parseFloat(value) +
                parseFloat(waveInfo.ab[idx][1]),
            });

            f.data[idx].originalData.push(parseFloat(value));
          });
        }
      });

      f.data.forEach((d, idx) => {
        const slicedData = d.originalData.slice(
          0,
          2 ** Math.floor(Math.log2(d.originalData.length))
        );
        const fftData = fft(slicedData);
        fftData.forEach(([real, image], index) => {
          f.fft_real[idx].dataPoints.push({
            x: index + 1,
            y: parseFloat(real),
          });

          f.fft_image[idx].dataPoints.push({
            x: index + 1,
            y: parseFloat(image),
          });
        });
      });

      f.axisX = {
        stripLines: Array.from({ length: 40 }, (_, i) => ({
          color: "#888",
          thickness: 1,
          value: parseInt(f.data[0].dataPoints.length / 40, 10) * i,
        })),
      };
    });
  };

  const handleSetWaveInfo = (key, index, which = null) => (event) => {
    setWaveInfo((info) => {
      if (which !== null) info[key][index][which] = event.target.value;
      else info[key][index] = event.target.value;
    });
  };

  const handleSubmit = () => {
    setCookie("WaveAnalysisInfo", JSON.stringify(waveInfo), 30);
    if (snackbarOpen) {
      setSnackbarOpen(false);
      setTimeout(() => setSnackbarOpen(true), 1000);
    } else setSnackbarOpen(true);
    setModalOpen(false);

    setFile((f) => {
      waveInfo.name.forEach((name, index) => {
        f.data[index].name = name;
      });

      f.data.forEach((d, index) => {
        d.dataPoints.forEach((dd, idx) => {
          dd.y =
            parseFloat(waveInfo.ab[index][0]) * d.originalData[idx] +
            parseFloat(waveInfo.ab[index][1]);
        });
      });
    });
  };

  const options = {
    animationEnabled: true,
    axisY: {
      includeZero: false,
    },
    backgroundColor: "transparent",
    colorSet: "materialColorSet",
    exportEnabled: true,
    legend: {
      cursor: "pointer",
      itemclick: (event) => {
        const { index } = event.dataSeries;
        const {
          chart: { exportFileName },
        } = event;
        const which = exportFileName.slice(-2);

        setFile((f) => {
          if (which === "實部")
            f.fft_real[index].visible = !f.fft_real[index].visible;
          else if (which === "虛部")
            f.fft_image[index].visible = !f.fft_image[index].visible;
          else f.data[index].visible = !f.data[index].visible;
        });

        event.chart.render();
      },
      verticalAlign: "top",
    },
    title: {
      fontFamily: `"Montserrat", "Helvetica Neue", Arial, sans-serif`,
      fontSize: 24,
      margin: 20,
    },
    toolTip: {
      shared: true,
    },
    zoomEnabled: true,
  };

  return (
    <MyBody>
      <AppBar position="fixed">
        <MyToolbar>
          <Typography variant="subtitle1">波形分析工具</Typography>
        </MyToolbar>
      </AppBar>
      <MyContainer>
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label htmlFor="csv-reader-input">
          <CSVReader
            inputId="csv-reader-input"
            inputStyle={{ display: "none" }}
            onFileLoaded={handleSetFile}
          />
          <Button
            color="primary"
            component="span"
            style={{ margin: "20px" }}
            variant="contained"
          >
            上傳CSV檔
          </Button>
        </label>
        <IconButton
          color="primary"
          component="span"
          onClick={handleSetModalOpen}
          variant="contained"
        >
          <SettingsIcon />
        </IconButton>
        {!!file.info && (
          <>
            <div style={{ marginBottom: "20px" }}>
              {isFFT ? "原始資料" : <strong>原始資料</strong>}{" "}
              <Switch
                checked={isFFT}
                onChange={handleSetIsFFT}
                color="default"
              />{" "}
              {isFFT ? <strong>FFT</strong> : "FFT"}{" "}
            </div>
            {!isFFT && (
              <CanvasJSChart
                options={{
                  ...options,
                  axisX: file.axisX,
                  data: file.data,
                  exportFileName: `${file.info.name.replace(
                    /.csv/gi,
                    ""
                  )}-波形分析`,
                  title: {
                    ...options.title,
                    text: `波形分析 - ${file.info.name}`,
                  },
                }}
              />
            )}
            {isFFT && (
              <Delay wait={5}>
                <CanvasJSChart
                  options={{
                    ...options,
                    axisX: file.axisX,
                    data: file.fft_real,
                    exportFileName: `${file.info.name.replace(
                      /.csv/gi,
                      ""
                    )}-波形分析 - FFT實部`,
                    title: {
                      ...options.title,
                      text: `波形分析 - FFT實部 - ${file.info.name}`,
                    },
                  }}
                />
              </Delay>
            )}
            {isFFT && (
              <>
                <br />
                <Delay wait={10}>
                  <CanvasJSChart
                    options={{
                      ...options,
                      axisX: file.axisX,
                      data: file.fft_image,
                      exportFileName: `${file.info.name.replace(
                        /.csv/gi,
                        ""
                      )}-波形分析 - FFT虛部`,
                      title: {
                        ...options.title,
                        text: `波形分析 - FFT虛部 - ${file.info.name}`,
                      },
                    }}
                  />
                </Delay>
              </>
            )}
          </>
        )}
      </MyContainer>

      <Modal
        onClose={handleSetModalOpen}
        open={modalOpen}
        style={{ overflow: "auto" }}
      >
        <EditForm>
          <AppBar position="static">
            <Tabs centered onChange={handleSetTab} value={tab}>
              <Tab label="名稱" />
              <Tab label="參數" />
            </Tabs>
          </AppBar>
          <div role="tabpanel" hidden={tab !== 0}>
            {tab === 0 && (
              <Box className="editBox" padding={3}>
                <Typography className="editTitle" variant="button">
                  編輯圖表 - 圖示名稱
                </Typography>
                <Divider />
                {Array.from({ length: 3 }, (_, index) => (
                  <div className="editFields" key={index}>
                    <TextField
                      label={`Ch${index + 1}`}
                      onChange={handleSetWaveInfo("name", index)}
                      value={waveInfo.name[index]}
                      variant="outlined"
                    />
                    <TextField
                      label={`Ch${index + 4}`}
                      onChange={handleSetWaveInfo("name", index + 3)}
                      value={waveInfo.name[index + 3]}
                      variant="outlined"
                    />
                  </div>
                ))}
                <div className="editFields">
                  <Button
                    component="span"
                    onClick={handleSetModalOpen}
                    variant="contained"
                  >
                    取消
                  </Button>
                  <Button
                    color="primary"
                    component="span"
                    onClick={handleSubmit}
                    variant="contained"
                  >
                    送出
                  </Button>
                </div>
              </Box>
            )}
          </div>
          <div role="tabpanel" hidden={tab !== 1}>
            {tab === 1 && (
              <Box className="editBox" padding={3}>
                <Typography className="editTitle" variant="button">
                  編輯圖表 - 資料點參數
                </Typography>
                <Divider />
                {Array.from({ length: 6 }, (_, index) => (
                  <div className="editFields" key={index}>
                    <TextField
                      label={`Ch${index + 1} - a`}
                      onChange={handleSetWaveInfo("ab", index, 0)}
                      type="number"
                      value={waveInfo.ab[index][0]}
                      variant="outlined"
                    />{" "}
                    <strong>x</strong> +
                    <TextField
                      label={`Ch${index + 1} - b`}
                      onChange={handleSetWaveInfo("ab", index, 1)}
                      type="number"
                      value={waveInfo.ab[index][1]}
                      variant="outlined"
                    />
                  </div>
                ))}
                <div className="editFields">
                  <Button
                    component="span"
                    onClick={handleSetModalOpen}
                    variant="contained"
                  >
                    取消
                  </Button>
                  <Button
                    color="primary"
                    component="span"
                    onClick={handleSubmit}
                    variant="contained"
                  >
                    送出
                  </Button>
                </div>
              </Box>
            )}
          </div>
        </EditForm>
      </Modal>

      <Snackbar
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleSnackbarClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        autoHideDuration={6000}
        message="變更已儲存"
        onClose={handleSnackbarClose}
        open={snackbarOpen}
      />
    </MyBody>
  );
}

export default App;
