import { onboard_bank } from "./schemas/onboard_bank";
import { onboard_branch } from "./schemas/onboard_branch";
import { onboard_device } from "./schemas/onboard_device";
import { onboard_device_model } from "./schemas/onboard_device_model";
import { onboard_firmware } from "./schemas/onboard_firmware";
import { onboard_manufacturer } from "./schemas/onboard_manufacturer";
import { onboard_merchant } from "./schemas/onboard_merchant";
import { onboard_vpa } from "./schemas/onboard_vpa";
import { bind_device } from "./schemas/bind_device";
import { allocate_to_bank } from "./schemas/allocate_to_bank";
import { allocate_to_branch } from "./schemas/allocate_to_branch";
import { allocate_to_merchant } from "./schemas/allocate_to_merchant";
import { deactivate_branch } from "./schemas/deactivate_branch";
import { deactivate_merchant } from "./schemas/deactivate_merchant";
import { deactivate_device } from "./schemas/deactivate_device";
import { deactivate_vpa } from "./schemas/deactivate_vpa";
import { update_merchant } from "./schemas/update_merchant";
import { update_bank } from "./schemas/update_bank";
import { update_device } from "./schemas/update_device";  
import { update_branch } from "./schemas/update_branch";
import { update_manufacturer } from "./schemas/update_manufacturer";
import { deactivate_bank } from "./schemas/deactivate_banks";
import { unbind_device } from "./schemas/unbind_device";
import { delete_vpa } from "./schemas/delete_vpa";
import { reallocate_to_bank } from "./schemas/reallocate_to_bank";
import { reallocate_to_branch } from "./schemas/reallocate_to_branch";
import { reallocate_to_merchant } from "./schemas/reallocate_to_merchant";
import e from "express";



export const schemaLoader = [
  { event: "ONBOARD_BANK", eschema: onboard_bank },
  { event: "ONBOARD_BRANCH", eschema: onboard_branch },
  { event: "ONBOARD_DEVICE", eschema: onboard_device },
  { event: "ONBOARD_FIRMWARE", eschema: onboard_firmware },
  { event: "ONBOARD_MERCHANT", eschema: onboard_merchant },
  { event: "ONBOARD_MANUFACTURER", eschema: onboard_manufacturer },
  { event: "ONBOARD_DEVICE_MODEL", eschema: onboard_device_model },
  { event: "ONBOARD_VPA", eschema: onboard_vpa },
  { event: "ALLOCATE_TO_BANK", eschema: allocate_to_bank },
  { event: "ALLOCATE_TO_BRANCH",eschema: allocate_to_branch },
  { event: "ALLOCATE_TO_MERCHANT",eschema: allocate_to_merchant },
  { event: "BIND_DEVICE", eschema: bind_device },
  { event: "UNBIND_DEVICE", eschema: unbind_device },
  { event: "DEACTIVATE_BANK", eschema: deactivate_bank },
  { event: "DEACTIVATE_BRANCH", eschema: deactivate_branch },
  { event: "DEACTIVATE_MERCHANT", eschema: deactivate_merchant },
  { event: "DEACTIVATE_DEVICE", eschema: deactivate_device },
  { event: "DEACTIVATE_VPA", eschema: deactivate_vpa },
  { event: "UPDATE_MERCHANT", eschema: update_merchant },
  { event: "UPDATE_BANK", eschema: update_bank },
  { event: "UPDATE_DEVICE", eschema: update_device },
  { event: "UPDATE_BRANCH", eschema: update_branch },
  { event: "UPDATE_MANUFACTURER", eschema: update_manufacturer },
  { event: "DELETE_VPA", eschema: delete_vpa },
  { event: "REALLOCATE_TO_BANK", eschema: reallocate_to_bank },
  { event: "REALLOCATE_TO_BRANCH", eschema: reallocate_to_branch },
  { event: "REALLOCATE_TO_MERCHANT", eschema: reallocate_to_merchant },
];
