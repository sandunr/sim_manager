import { useEffect, useRef, useState } from 'react';
import { Button, Confirm, Form, Menu, Modal } from 'semantic-ui-react';
import { ToastContainer, toast } from 'react-toastify';
import Axios from './Axios';
import Papa from 'papaparse';
import ClipLoader from "react-spinners/ClipLoader";

import './App.css';
import 'semantic-ui-css/semantic.min.css';
import 'react-toastify/dist/ReactToastify.css';

const override = {
  display: "block",
  margin: "0 auto",
  borderColor: "red",
};

function App() {
  const [sims, setSims] = useState([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [editingSim, setEditingSim] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [newSim, setNewSim] = useState(null);
  const [newUser, setNewUser] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sims');
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);

  const uploadInputRef = useRef();

  useEffect(() => {
    getSims();
    getMyInfo();
  }, []);

  function checkForExpiredSims(simList) {
    if (simList.length > 0) {
      let expired_sims = [];
      simList.forEach(sim => {
        if (sim.days_left === -1) {
          expired_sims.push(sim.meid);
        }
      });
      if (expired_sims.length > 0) {
        new Notification(`Following Sims have expired ${expired_sims.join(',')}`);
      }
    }
  }

  function getMyInfo() {
    Axios.get('/api/users/me').then(result => {
      if (result.data.success) {
        setMe(result.data.data);
      }
    })
      .catch(err => {
        toast.error("Unable to get my info");
      });
  }

  function getUsers() {
    setLoading(true);
    Axios.get('/api/users').then(result => {
      if (result.data.success) {
        setUsers(result.data.data);
        setLoading(false);
      }
    })
      .catch(err => {
        toast.error("Unable to get the users list");
        setLoading(false);
      });
  }

  function getSims() {
    setLoading(true);
    Axios.get('/api/sims').then(result => {
      if (result.data.success) {
        setSims(result.data.data);
        if (Notification.permission != 'granted') {
          Notification.requestPermission().then(response => {
            if (response === 'granted') {
              checkForExpiredSims(result.data.data);
            }
          });
        } else {
          checkForExpiredSims(result.data.data);
        }
        setLoading(false);
      }
    })
      .catch(err => {
        toast.error("Unable to get the sim list");
        setLoading(false);
      });
  }

  function downloadCsv() {
    setLoading(true);
    Axios.get('/api/sims/csv', { responseType: 'blob' })
      .then(result => {
        if (result.data) {
          const url = window.URL.createObjectURL(new Blob([result.data], { type: 'text/csv' }));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'sims.csv');
          document.body.appendChild(link);
          link.click();
        } else {
          toast.error('Unable to download CSV');
        }
        setLoading(false);
      }).catch(err => {
        toast.error('Unable to download CSV');
        setLoading(false);
        console.log(err);
      })
  }

  function handleUpdateChange(e, { value, name }) {
    let _editingSim = { ...editingSim };
    _editingSim[name] = value;
    setEditingSim(_editingSim);
  }

  function handleCreateChange(e, { value, name }) {
    let _newSim = newSim ? { ...newSim } : {};
    _newSim[name] = value;
    setNewSim(_newSim);
  }

  function handleNewUserChange(e, { value, name }) {
    let _newUser = newUser ? { ...newUser } : {};
    _newUser[name] = value;
    setNewUser(_newUser);
  }

  function handleCreate() {
    setLoading(true);
    Axios.post('/api/sims', newSim).then(result => {
      if (result.data.success) {
        toast("Sim Created");
        getSims();
        setCreateModalOpen(false);
        setNewSim(null);
      } else {
        toast.error(result.data.error);
      }
      setLoading(false);
    })
      .catch(err => {
        toast.error("Unable to create sim");
        setLoading(false);
      });
  }
  
  function handleCreateUser() {
    setLoading(true);
    Axios.post('/api/users', newUser).then(result => {
      if (result.data.success) {
        toast("User Created");
        getUsers();
        setCreateUserModalOpen(false);
        setNewUser(null);
      } else {
        toast.error(result.data.error);
      }
      setLoading(false);
    })
      .catch(err => {
        toast.error("Unable to create user");
        setLoading(false);
      });
  }

  function handleUpdate() {
    setLoading(true);
    Axios.put(`/api/sims/${editingSim.id}`, editingSim).then(result => {
      if (result.data.success) {
        toast("Sim Updated");
        getSims();
        setUpdateModalOpen(false);
        setEditingSim(null);
      }
      setLoading(false);
    })
      .catch(err => {
        toast.error("Unable to update sim");
        setLoading(false);
      });
  }

  function onCancelUpdate() {
    setUpdateModalOpen(false);
    setEditingSim(null);
  }

  function onCancelCreate() {
    setCreateModalOpen(false);
    setNewSim(null);
  }
  
  function onCancelCreateUser() {
    setCreateUserModalOpen(false);
    setNewUser(null);
  }

  function deleteSim(id) {
    setLoading(true);
    Axios.delete(`/api/sims/${id}`)
      .then(result => {
        if (result.data.success) {
          toast.success("Sim deleted");
          getSims();
        } else {
          toast.error(result.data.error);
        }
        setLoading(false);
      })
    setConfirmMessage(null);
    setConfirmOpen(false);
    setLoading(false);
  }

  function uploadCsv(event) {
    setLoading(true);
    Papa.parse(event.target.files[0], {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        const data = [];
        results.data.map((d) => {
          const values = Object.values(d);
          data.push({
            meid: values[0],
            project_name: values[1],
            brand: values[2],
            iccid: values[3],
            added_features: values[4],
            banTo_activate_on: values[5],
            length_of_activation: values[6],
            mdn: values[7],
            msid: values[8],
            msl: values[9],
            request_on: values[10],
            expires_on: values[11],
            comments: values[12]
          });
        });

        Axios.post('/api/sims/csv', data)
          .then(result => {
            if (result.data.success) {
              toast.success("Csv Upload Successful");
              getSims();
            } else {
              toast.error(result.data.error);
            }
            event.target.value = null;
            setLoading(false);
          })
          .catch(err => {
            toast.error(err);
            event.target.value = null;
            setLoading(false);
          })
      },
    });
  }

  function onCreateSim() {
    setNewSim({
      meid: null,
      project_name: null,
      brand: null,
      iccid: null,
      added_features: null,
      ban_to_activate_on: null,
      length_of_activation: null,
      mdn: null,
      msid: null,
      msl: null,
      request_on: null,
      expires_on: null,
      comments: null
    });
    setCreateModalOpen(true);
  }
  
  function onCreateUser() {
    setNewUser({
      firstName: null,
      lastName: null,
      email: null,
      isAdmin: false,
      password: null,
    });
    setCreateUserModalOpen(true);
  }

  function deleteUser(userId) {
    setLoading(true);
    Axios.delete(`/api/users/${userId}`)
      .then(result => {
        if (result.data.success) {
          toast.success("User deleted");
          getUsers();
        } else {
          toast.error(result.data.error);
        }
        setLoading(false);
      })
    setConfirmMessage(null);
    setConfirmOpen(false);
    setLoading(false);
  }

  function onLogout() {
    Axios.get('/logout')
    .then(res => {
      window.location.reload('/login');
    })
    .catch(err => console.log(err));
  }

  const isAdmin = me && me.isAdmin;

  function getMenuItems() {
    let menuItems = [
      <Menu.Item
        name='editorials'
        active={activeTab === 'sims'}
        onClick={() => {
          setActiveTab('sims');
          getSims();
        }}
      >
        Sims
      </Menu.Item>
    ];

    if (isAdmin) {
      menuItems.push(
        <Menu.Item
          name='users'
          active={activeTab === 'users'}
          onClick={() => {
            setActiveTab('users');
            getUsers();
          }}
        >
          Users
        </Menu.Item>
      );
    }
    return menuItems;
  }

  return (
    <div className="App">
      <Menu secondary>
        <Menu.Menu position='right'>
          <Menu.Item>
            {me?.email}
          </Menu.Item>
          <Menu.Item
            name='logout'
            onClick={onLogout}
          />
        </Menu.Menu>
      </Menu>
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: "39000",
        }}
      >
        <ClipLoader
          color={'#ffffff'}
          loading={loading}
          cssOverride={override}
          size={150}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      </div>
      <ToastContainer
        autoClose={3000}
      />
      <div className="ui large header" style={{ marginBottom: 50 }}>SIM TRACKER</div>
      <Menu secondary>
        {getMenuItems()}
      </Menu>
      {activeTab === 'sims' &&
        <>
          <div className="ui grid">
            <div className="left floated column">
              <div className="ui medium header left align">{sims.length} Sims</div>
            </div>
            <input ref={uploadInputRef} accept='.csv' name='file' type='file' onChange={uploadCsv} style={{ display: "block", margin: "10px 10px" }} />
            <div className="ui buttons small" style={{ marginBottom: 25 }}>
              <button className="ui small primary button" onClick={downloadCsv}>Download CSV</button>
              <button className="ui small primary secondary button" onClick={getSims}>Refresh</button>
              <button className="ui small primary button" onClick={onCreateSim}>Create</button>
            </div>
          </div>
          <table className="ui celled inverted selectable table stackable small">
            <thead className="">
              <tr className="">
                <th className=""></th>
                <th className="">MEID</th>
                <th className="">Project Name</th>
                <th className="">Brand</th>
                <th className="">ICCID</th>
                <th className="">Added Features</th>
                <th className="">BAN to Activate On</th>
                <th className="">Length of Activation</th>
                <th className="">MDN</th>
                <th className="">MSID</th>
                <th className="">MSL</th>
                <th className="">Request On</th>
                <th className="">Expires On</th>
                <th className="">Comments</th>
                <th className="">Days Left</th>
                <th className="">Create Date</th>
                <th className=""></th>
              </tr>
            </thead>
            <tbody className="">
              {sims.map((sim, idx) => (
                <tr className="" key={sim.id}>
                  <td className="">{idx + 1}</td>
                  <td className="">{sim.meid}</td>
                  <td className="">{sim.project_name}</td>
                  <td className="">{sim.brand}</td>
                  <td className="">{sim.iccid}</td>
                  <td className="">{sim.added_features}</td>
                  <td className="">{sim.ban_to_activate_on}</td>
                  <td className="">{sim.length_of_activation}</td>
                  <td className="">{sim.mdn}</td>
                  <td className="">{sim.msid}</td>
                  <td className="">{sim.msl}</td>
                  <td className="">{sim.request_on}</td>
                  <td className="">{sim.expires_on}</td>
                  <td className="">{sim.comments}</td>
                  <td className="">{sim.days_left && (sim.days_left === -1 ? <span style={{ color: 'red' }}>Expired</span> : sim.days_left)}</td>
                  <td className="">{sim.create_date && new Date(sim.create_date).toLocaleString() + ' PT'}</td>
                  <td className="">
                    <div>
                      <button className="ui mini primary button"
                        onClick={() => {
                          setEditingSim(sim);
                          setUpdateModalOpen(true);
                        }}
                      >Update</button>
                      <button className="ui mini negative button"
                        onClick={() => {
                          setConfirmMessage("Are you sure?");
                          setConfirmOpen(true);
                        }}
                      >Delete</button>
                      <Confirm
                        open={confirmOpen}
                        onCancel={() => {
                          setConfirmOpen(false);
                          setConfirmMessage(null);
                        }}
                        onConfirm={() => deleteSim(sim.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      }
      {(isAdmin && activeTab === 'users') &&
        <>
          <div className="ui grid">
            <div className="left floated column">
              <div className="ui medium header left align">{sims.length} Users</div>
            </div>
            <div className="ui buttons small" style={{ marginBottom: 25 }}>
              <button className="ui small primary secondary button" onClick={getUsers}>Refresh</button>
              <button className="ui small primary button" onClick={onCreateUser}>Create</button>
            </div>
          </div>
          <table className="ui celled inverted selectable table stackable small">
            <thead className="">
              <tr className="">
                <th className=""></th>
                <th className="">First Name</th>
                <th className="">Last Name</th>
                <th className="">Email</th>
                <th className="">Admin?</th>
                <th className=""></th>
              </tr>
            </thead>
            <tbody className="">
              {users.map((user, idx) => (
                <tr className="" key={user.id}>
                  <td className="">{idx + 1}</td>
                  <td className="">{user.firstName}</td>
                  <td className="">{user.lastName}</td>
                  <td className="">{user.email}</td>
                  <td className="">{user.isAdmin ? 'Yes' : 'No'}</td>
                  <td className="">
                    <div>
                      <button 
                        className="ui mini negative button"
                        onClick={() => {
                          setConfirmMessage("Are you sure?");
                          setConfirmOpen(true);
                        }}
                      >
                        Delete
                      </button>
                      <Confirm
                        open={confirmOpen}
                        onCancel={() => {
                          setConfirmOpen(false);
                          setConfirmMessage(null);
                        }}
                        onConfirm={() => deleteUser(user.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      }
      {createModalOpen &&
        <Modal
          open={createModalOpen}
          onClose={() => {
            setCreateModalOpen(false);
            setNewSim(null);
          }}
          trigger={<Button></Button>}
          closeOnDimmerClick={false}
          closeOnEscape={false}
        >
          <Modal.Header>Sim Details</Modal.Header>
          <Modal.Content scrolling>
            <Modal.Description>
              <Form>
                <Form.Group>
                  <Form.Input
                    placeholder='MEID'
                    name='meid'
                    label='MEID'
                    value={newSim?.meid || ''}
                    onChange={handleCreateChange}
                  />
                  <Form.Input
                    placeholder='Project Name'
                    name='project_name'
                    label='Project Name'
                    value={newSim?.project_name || ''}
                    onChange={handleCreateChange}
                  />
                  <Form.Input
                    placeholder='Brand'
                    name='brand'
                    label='Brand'
                    value={newSim?.brand || ''}
                    onChange={handleCreateChange}
                  />
                  <Form.Input
                    placeholder='ICCID'
                    name='iccid'
                    label='ICCID'
                    value={newSim?.iccid || ''}
                    onChange={handleCreateChange}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Input
                    placeholder='Added Features'
                    name='added_features'
                    label='Added Features'
                    value={newSim?.added_features || ''}
                    onChange={handleCreateChange}
                  />
                  <Form.Input
                    placeholder='BAN To Activate On'
                    name='ban_to_activate _on'
                    label='BAN To Activate On'
                    value={newSim?.ban_to_activate || ''}
                    onChange={handleCreateChange}
                  />
                  <Form.Input
                    placeholder='Length of Activation'
                    name='length_of_activation'
                    label='Length of Activation'
                    value={newSim?.length_of_activation || ''}
                    onChange={handleCreateChange}
                  />
                  <Form.Input
                    placeholder='MDN'
                    name='mdn'
                    label='MDN'
                    value={newSim?.mdn || ''}
                    onChange={handleCreateChange}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Input
                    placeholder='MSID'
                    name='msid'
                    label='MSID'
                    value={newSim?.msid || ''}
                    onChange={handleCreateChange}
                  />
                  <Form.Input
                    placeholder='MSL'
                    name='msl'
                    label='MSL'
                    value={newSim?.msl || ''}
                    onChange={handleCreateChange}
                  />
                  <Form.Input
                    placeholder='Request On'
                    name='request_on'
                    label='Request On'
                    value={newSim?.request_on || ''}
                    onChange={handleCreateChange}
                  />
                  <Form.Input
                    placeholder='MM/DD/YYYY'
                    name='expires_on'
                    label='Expires On'
                    value={newSim?.expires_on || ''}
                    onChange={handleCreateChange}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Input
                    placeholder='Comments'
                    name='comments'
                    label='Comments'
                    value={newSim?.comments || ''}
                    onChange={handleUpdateChange}
                  />
                </Form.Group>
              </Form>
            </Modal.Description>
          </Modal.Content>
          <Modal.Actions>
            <Button negative onClick={onCancelCreate} primary>Cancel</Button>
            <Button onClick={handleCreate} primary>
              Create
            </Button>
          </Modal.Actions>
        </Modal>
      }
      {updateModalOpen &&
        <Modal
          open={updateModalOpen}
          trigger={<Button></Button>}
          closeOnDimmerClick={false}
          closeOnEscape={false}
        >
          <Modal.Header>Update Sim</Modal.Header>
          <Modal.Content scrolling>
            <Modal.Description>
              <Form>
                <Form.Group>
                  <Form.Input
                    placeholder='MEID'
                    name='meid'
                    label='MEID'
                    value={editingSim.meid || ''}
                    onChange={handleUpdateChange}
                  />
                  <Form.Input
                    placeholder='Project Name'
                    name='project_name'
                    label='Project Name'
                    value={editingSim.project_name || ''}
                    onChange={handleUpdateChange}
                  />
                  <Form.Input
                    placeholder='Brand'
                    name='brand'
                    label='Brand'
                    value={editingSim.brand || ''}
                    onChange={handleUpdateChange}
                  />
                  <Form.Input
                    placeholder='ICCID'
                    name='iccid'
                    label='ICCID'
                    value={editingSim.iccid || ''}
                    onChange={handleUpdateChange}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Input
                    placeholder='Added Features'
                    name='added_features'
                    label='Added Features'
                    value={editingSim.added_features || ''}
                    onChange={handleUpdateChange}
                  />
                  <Form.Input
                    placeholder='BAN To Activate On'
                    name='ban_to_activate _on'
                    label='BAN To Activate On'
                    value={editingSim.ban_to_activate || ''}
                    onChange={handleUpdateChange}
                  />
                  <Form.Input
                    placeholder='Length of Activation'
                    name='length_of_activation'
                    label='Length of Activation'
                    value={editingSim.length_of_activation || ''}
                    onChange={handleUpdateChange}
                  />
                  <Form.Input
                    placeholder='MDN'
                    name='mdn'
                    label='MDN'
                    value={editingSim.mdn || ''}
                    onChange={handleUpdateChange}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Input
                    placeholder='MSID'
                    name='msid'
                    label='MSID'
                    value={editingSim.msid || ''}
                    onChange={handleUpdateChange}
                  />
                  <Form.Input
                    placeholder='MSL'
                    name='msl'
                    label='MSL'
                    value={editingSim.msl || ''}
                    onChange={handleUpdateChange}
                  />
                  <Form.Input
                    placeholder='Request On'
                    name='request_on'
                    label='Request On'
                    value={editingSim.request_on || ''}
                    onChange={handleUpdateChange}
                  />
                  <Form.Input
                    placeholder='MM/DD/YY'
                    name='expires_on'
                    label='Expires On'
                    value={editingSim.expires_on || ''}
                    onChange={handleUpdateChange}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Input
                    placeholder='Comments'
                    name='comments'
                    label='Comments'
                    value={editingSim.comments || ''}
                    onChange={handleUpdateChange}
                  />
                </Form.Group>
              </Form>
            </Modal.Description>
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={onCancelUpdate} primary negative>Cancel</Button>
            <Button onClick={handleUpdate} primary>
              Update
            </Button>
          </Modal.Actions>
        </Modal>
      }
      {createUserModalOpen &&
        <Modal
          open={createUserModalOpen}
          onClose={() => {
            setCreateUserModalOpen(false);
            setNewUser(null);
          }}
          trigger={<Button></Button>}
          closeOnDimmerClick={false}
          closeOnEscape={false}
        >
        <Modal.Header>User Details</Modal.Header>
          <Modal.Content scrolling>
            <Modal.Description>
              <Form>
                <Form.Group>
                  <Form.Input
                    placeholder='First Name'
                    name='firstName'
                    label='First Name'
                    value={newUser?.firstName || ''}
                    onChange={handleNewUserChange}
                  />
                  <Form.Input
                    placeholder='Last Name'
                    name='lastName'
                    label='Last Name'
                    value={newUser?.lastName || ''}
                    onChange={handleNewUserChange}
                  />
                  <Form.Input
                    placeholder='Email'
                    name='email'
                    label='Email'
                    value={newUser?.email || ''}
                    onChange={handleNewUserChange}
                  />
                  <Form.Input
                    placeholder='Default Password'
                    name='password'
                    label='Default Password'
                    value={newUser?.password || ''}
                    onChange={handleNewUserChange}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Checkbox label='Admin?' name='isAdmin' onChange={handleNewUserChange} value={newUser?.isAdmin || false} />
                </Form.Group>
              </Form>
            </Modal.Description>
          </Modal.Content>
          <Modal.Actions>
            <Button negative onClick={onCancelCreateUser} primary>Cancel</Button>
            <Button onClick={handleCreateUser} primary>
              Create
            </Button>
          </Modal.Actions>
        </Modal>
      }
    </div>
  );
}

export default App;
