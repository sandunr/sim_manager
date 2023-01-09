import { useEffect, useState } from 'react';
import { Button, Confirm, Form, Image, Modal } from 'semantic-ui-react';
import { ToastContainer, toast } from 'react-toastify';
import Axios from './Axios';
import './App.css';
import 'semantic-ui-css/semantic.min.css';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [sims, setSims] = useState([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [editingSim, setEditingSim] = useState(null);
  const [newSim, setNewSim] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState(false);

  useEffect(() => {
    getSims();
  }, []);

  function getSims() {
    Axios.get('/api/sims').then(result => {
      if (result.data.success) {
        setSims(result.data.data);
      }
    })
    .catch(err => {
      toast.error("Unable to get the sim list");
    });
  }

  function downloadCsv() {
    Axios.get('/api/sims/csv', { responseType: 'blob' })
    .then(result => {
      if (result.data) {
        const url = window.URL.createObjectURL(new Blob([result.data], { type: 'text/csv' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', result.headers["content-disposition"].split("filename=")[1]);
        document.body.appendChild(link);
        link.click();
      } else {
        toast.error('Unable to download CSV');
      }
    }).catch(err => {
      toast.error('Unable to download CSV');
      console.log(err);
    })
  }

  function handleUpdateChange(e, { value, name }) {
    let _editingSim = {...editingSim};
    _editingSim[name] = value;
    setEditingSim(_editingSim);
  }

  function handleCreateChange(e, { value, name }) {
    let _newSim = newSim ? {...newSim} : {};
    _newSim[name] = value;
    setNewSim(_newSim);
  }

  function handleCreate() {
    Axios.post('/api/sims', newSim).then(result => {
      if (result.data.success) {
        toast("Sim Created");
        getSims();
        setCreateModalOpen(false);
        setNewSim(null);
      } else {
        toast.error(result.data.error);
      }
    })
    .catch(err => {
      toast.error("Unable to create sim");
    });
  }

  function handleUpdate() {
    Axios.put(`/api/sims/${editingSim.id}`, editingSim).then(result => {
      if (result.data.success) {
        toast("Sim Updated");
        getSims();
        setUpdateModalOpen(false);
        setEditingSim(null);
      }
    })
    .catch(err => {
      toast.error("Unable to update sim");
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

  function deleteSim(id) {
    Axios.delete(`/api/sims/${id}`)
    .then(result => {
      if (result.data.success) {
        toast.success("Sim deleted");
        getSims();
      } else {
        toast.error(result.data.error);
      }
    })
    setConfirmMessage(null);
    setConfirmOpen(false);
  }

  return (
    <div className="App">
      <ToastContainer
        autoClose={3000}
      />
      <div className="ui large header" style={{ marginBottom: 50 }}>SIM TRACKER</div>
      <div className="ui grid">
        <div className="left floated column">
        <div className="ui medium header left align">{sims.length} Sims</div>
        </div>
        <div className="ui buttons small" style={{ marginBottom: 25 }}>
          <button className="ui small primary button" onClick={downloadCsv}>Download CSV</button>
          <button className="ui small primary secondary button" onClick={getSims}>Refresh</button>
          <button className="ui small primary button" onClick={() => setCreateModalOpen(true)}>Create</button>
        </div>
      </div>
      <table className="ui celled inverted selectable table stackable">
        <thead className="">
          <tr className="">
            <th className=""></th>
            <th className="">Phone</th>
            <th className="">Owner</th>
            <th className="">Email</th>
            <th className="">Expire Date</th>
            <th className="">Create Date</th>
            <th className=""></th>
          </tr>
        </thead>
        <tbody className="">
          {sims.map((sim, idx) => (
            <tr className="" key={sim.id}>
              <td className="">{idx + 1}</td>
              <td className="">{sim.phone}</td>
              <td className="">{sim.owner}</td>
              <td className="">{sim.email}</td>
              <td className="">{sim.expireDate}</td>
              <td className="">{sim.createDate && new Date(sim.createDate).toLocaleString() + ' PT'}</td>
              <td className="">
                <div>
                  <button className="ui small primary button" 
                    onClick={() => {
                      setEditingSim(sim);
                      setUpdateModalOpen(true);
                    }}
                  >Update</button>
                  <button className="ui small negative button"
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
                    onConfirm={()=> deleteSim(sim.id)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {createModalOpen &&
        <Modal
          open={createModalOpen}
          onClose={() => {
            setCreateModalOpen(false);
            setNewSim(null);
          }}
          trigger={<Button>Scrolling Content Modal</Button>}
          closeOnDimmerClick={false}
          closeOnEscape={false}
        >
          <Modal.Header>Profile Picture</Modal.Header>
          <Modal.Content scrolling>
            <Modal.Description>
            <Form>
                <Form.Group>
                  <Form.Input
                    placeholder='Phone Number'
                    name='phone'
                    label='Phone Number'
                    value={newSim?.phone || ''}
                    onChange={handleCreateChange}
                  />
                  <Form.Input
                    placeholder='Owner Name'
                    name='owner'
                    label='Owner Name'
                    value={newSim?.owner || ''}
                    onChange={handleCreateChange}
                  />
                  <Form.Input
                    placeholder='Owner Email'
                    name='email'
                    label='Owner Email'
                    value={newSim?.email || ''}
                    onChange={handleCreateChange}
                  />
                  <Form.Input
                    placeholder='MM/DD/YYYY'
                    name='expireDate'
                    label='Expire Date'
                    value={newSim?.expireDate || ''}
                    onChange={handleCreateChange}
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
          trigger={<Button>Scrolling Content Modal</Button>}
          closeOnDimmerClick={false}
          closeOnEscape={false}
        >
          <Modal.Header>Update Sim</Modal.Header>
          <Modal.Content scrolling>
            <Modal.Description>
              <Form>
                <Form.Group>
                  <Form.Input
                    placeholder='Phone Number'
                    name='phone'
                    label='Phone Number'
                    value={editingSim.phone}
                    onChange={handleUpdateChange}
                  />
                  <Form.Input
                    placeholder='Owner Name'
                    name='owner'
                    label='Owner Name'
                    value={editingSim.owner}
                    onChange={handleUpdateChange}
                  />
                  <Form.Input
                    placeholder='Owner Email'
                    name='email'
                    label='Owner Email'
                    value={editingSim.email}
                    onChange={handleUpdateChange}
                  />
                  <Form.Input
                    placeholder='MM/DD/YYYY'
                    name='expireDate'
                    label='Expire Date'
                    value={editingSim.expireDate}
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
    </div>
  );
}

export default App;
