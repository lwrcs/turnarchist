import * as UAParser from "ua-parser-js";

export interface DeviceInfo {
  os: UAParser.IOS;
  browser: UAParser.IBrowser;
  device: UAParser.IDevice;
  orientation: OrientationType;
}

export const getDeviceInfo = (): DeviceInfo => {
  const parser = new UAParser.UAParser(navigator.userAgent);
  const result = parser.getResult();
  const { browser, device, os } = result;

  return {
    os,
    browser,
    device,
    orientation: screen.orientation.type,
  };
};
