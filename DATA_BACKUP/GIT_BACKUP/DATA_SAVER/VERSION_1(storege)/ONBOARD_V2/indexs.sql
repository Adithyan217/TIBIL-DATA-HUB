----------------------------------SB INDEXS
-- Index on did
CREATE INDEX idx_sb_did
ON registry.sb (did);

CREATE INDEX idx_sb_did_isd
ON registry.sb (did,isd);

CREATE INDEX idx_sb_did_mid
ON registry.sb (did,mid);

-- Index on vid
CREATE INDEX idx_sb_vid
ON registry.sb (vid);

CREATE INDEX idx_sb_vid_isd
ON registry.sb (vid,isd);

-- Index on mid
CREATE INDEX idx_sb_mid
ON registry.sb (mid);

CREATE INDEX idx_sb_mid_isd
ON registry.sb (mid, isd);

-- Index on bid
CREATE INDEX idx_sb_bid
ON registry.sb (bid);

CREATE INDEX idx_sb_bid_isd
ON registry.sb (bid, isd);

-- Index on brid
CREATE INDEX idx_sb_brid
ON registry.sb (brid);

CREATE INDEX idx_sb_brid_isd
ON registry.sb (brid, isd);


----------------------------VPA INDEXS

CREATE INDEX idx_vpa_vpa
ON registry.vpa (vpa);

CREATE INDEX idx_vpa_vpa_isd
ON registry.vpa (vpa, isd);

CREATE INDEX idx_vpa_bid
ON registry.vpa (bid);

CREATE INDEX idx_vpa_bid_isd
ON registry.vpa (bid, isd);


---------------------BANK INDEXES

CREATE INDEX idx_banks_bname
ON registry.banks (bname);

CREATE INDEX idx_banks_bname_isd
ON registry.banks (bname, isd);


----------------------BRANCH INDEXES

CREATE INDEX idx_branches_brname
ON registry.branches (brname);



CREATE INDEX idx_branches_bid
ON registry.branches (bid);


---------------------DEVICES INDEXES

CREATE INDEX idx_devices_dname
ON registry.devices (dname);

CREATE INDEX idx_devices_mfid
ON registry.devices (mfid);

CREATE INDEX idx_devices_fid
ON registry.devices (fid);

CREATE INDEX idx_devices_mdid
ON registry.devices (mdid);





--------------------MERCHANTS INDEXES

CREATE INDEX idx_merchants_mname
ON registry.merchants (mname);

CREATE INDEX idx_merchants_bid
ON registry.merchants (bid);



-----------------------FIRMWARE INDEXES

CREATE INDEX idx_firmware_fname
ON registry.firmware (fname);

CREATE INDEX idx_firmware_mfid
ON registry.firmware (mfid);

CREATE INDEX idx_firmware_
ON registry.firmware (fname);


-----------------------MF INDEXES

CREATE INDEX idx_mf_mfname
ON registry.mf (mfname);

-----------------------MODELS INDEXES

CREATE INDEX idx_model_mfid
ON registry.model (mfid);

CREATE INDEX idx_model_fid
ON registry.model (fid);

CREATE INDEX idx_model_mdname
ON registry.model (mdname);

