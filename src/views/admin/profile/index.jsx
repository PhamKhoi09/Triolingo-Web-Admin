/*!
  _   _  ___  ____  ___ ________  _   _   _   _ ___   
 | | | |/ _ \|  _ \|_ _|__  / _ \| \ | | | | | |_ _| 
 | |_| | | | | |_) || |  / / | | |  \| | | | | || | 
 |  _  | |_| |  _ < | | / /| |_| | |\  | | |_| || |
 |_| |_|\___/|_| \_\___/____\___/|_| \_|  \___/|___|
                                                                                                                                                                                                                                                                                                                                       
=========================================================
* Horizon UI - v1.1.0
=========================================================

* Product Page: https://www.horizon-ui.com/
* Copyright 2023 Horizon UI (https://www.horizon-ui.com/)

* Designed and Coded by Simmmple

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/

// Chakra imports
import { Box, Grid } from "@chakra-ui/react";

// Custom components
import Banner from "views/admin/profile/components/Banner";
import General from "views/admin/profile/components/General";
import Projects from "views/admin/profile/components/Projects";
import Storage from "views/admin/profile/components/Storage";
import Upload from "views/admin/profile/components/Upload";
import AdminSettings from "views/admin/profile/components/AdminSettings";
import DeleteUser from "views/admin/profile/components/DeleteUser";
import Opinions from "views/admin/profile/components/Opinions";

// Assets
import banner from "assets/img/auth/banner.png";
import avatar from "assets/img/avatars/avatar4.png";
import React, { useState } from "react";
import { useLocation } from 'react-router-dom';

export default function Overview() {
  const location = useLocation();
  const user = location.state && location.state.user ? location.state.user : null;

  const bannerImg = user && user.banner ? user.banner : banner;
  const avatarImg = user && user.avatar ? user.avatar : avatar;
  const name = user && user.name ? user.name : 'Adela Parkson';
  const job = user && user.job ? user.job : 'Product Designer';
  // Only allow 'Admin' or 'Learner' roles — default to 'Learner' for anything else
  const rawRole = user && user.role ? user.role : null;
  const initialRole = rawRole && String(rawRole).toLowerCase() === 'admin' ? 'Admin' : 'Learner';
  const [role, setRole] = useState(initialRole);
  const status = user && user.status ? user.status : 'Online';

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Grid
        templateColumns={{ base: '1fr', lg: '2fr 1fr' }}
        gap={{ base: '20px', xl: '20px' }}
      >
        <Box>
          <Banner
            banner={bannerImg}
            avatar={avatarImg}
            name={name}
            job={job}
            role={role}
            onRoleChange={(r) => setRole(r)}
            status={status}
          />

          <General mt="20px" />
        </Box>

        <Box>
          <AdminSettings />
          <DeleteUser />
          <Opinions />
        </Box>
      </Grid>
    </Box>
  );
}
