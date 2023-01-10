import { useEffect, useRef, useState } from 'react';
import { Button, Confirm, Form, Image, Modal } from 'semantic-ui-react';
import { ToastContainer, toast } from 'react-toastify';
import Axios from './Axios';
import Papa from 'papaparse';
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

  const uploadInputRef = useRef();

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
        link.setAttribute('download', 'sims.csv');
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

  function uploadCsv(event) {
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
        })
        .catch(err => {
          toast.error(err);
          event.target.value = null;
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
    </div>
  );
}

export default App;
