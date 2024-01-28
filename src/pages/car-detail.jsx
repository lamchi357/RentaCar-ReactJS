import React, {useEffect, useRef, useState} from 'react';
import {useParams, useNavigate} from "react-router-dom";
import Swal from 'sweetalert2'

import {vehiclesData, locationsData} from "../DATA/data.jsx";

import {Container, Row, Col, Form, ListGroup, InputGroup, Button, Spinner} from 'react-bootstrap';

import {TbEngine, TbManualGearbox} from "react-icons/tb";
import {BsCarFront, BsFillCarFrontFill, BsFillFuelPumpFill} from "react-icons/bs";
import {PiEngineFill} from "react-icons/pi";

import {useDispatch} from "react-redux";
import {makeReservation, reserveNow} from "../redux/features/ReserveSlice";

import {fetchBrands, fetchModels, fetchCars, fetchLocations} from "../hooks/useFetchData";
import {collection, getDocs, query, where} from "firebase/firestore";
import {db} from "../config/firebase";

const CarDetail = () => {

    const dispatch = useDispatch();

    const {carBrand, carModel, carId} = useParams();
    const navigate = useNavigate();

    const [cars, setCars] = useState(null);
    const [brands, setBrands] = useState(null);
    const [models, setModels] = useState(null);
    const [locations, setLocations] = useState(null);

    const [selectedLocations, setSelectedLocations] = useState(null);
    const [rentDate, setRentDate] = useState({start: getDateByInputFormat(), end: getDateByInputFormat(1)});

    const [isReservationTimerEnable, setIsReservationTimerEnable] = useState(true);
    const [reservationTimer, setReservationTimer] = useState(59); //in seconds

    useEffect(() => {

        console.log(carBrand)
        console.log(carModel)
        console.log(carId)

        fetchBrands().then(response => setBrands(response));
        fetchModels().then(response => setModels(response));
        fetchCars().then(response => setCars(response));
        fetchLocations().then(response => {

            setLocations(response)
            setSelectedLocations({
                pickup: response[0],
                dropoff: response[0]
            })
        });

    }, []);


    function getDateByInputFormat(dayOffset= 0, date = null) {

        let currentDate = date === null ? new Date() : new Date(date)
        if(dayOffset === 0) return currentDate.toISOString().split('T')[0]

        const offsetDate = new Date(currentDate)
        offsetDate.setDate(currentDate.getDate() + dayOffset)
        return offsetDate.toISOString().split('T')[0]
    }
    function timerToString() {
        let hours = ('0' + Math.floor(reservationTimer/3600)).slice(-2);
        let minutes = ('0' + Math.floor(reservationTimer/60)).slice(-2);
        let seconds = ('0' + reservationTimer%60).slice(-2);
        return /*hours + ":" +*/ minutes + ":" + seconds;
    }
    function handleReserveTimeout() {

        let redirectTimerInterval
        Swal.fire({
            title: 'You did not complete the reservation!',
            html:
                'You are being redirected in <strong>5</strong> seconds',
            timer: 5000,
            didOpen: () => {
                const content = Swal.getHtmlContainer()
                const $ = content.querySelector.bind(content)

                Swal.showLoading()

                redirectTimerInterval = setInterval(() => {
                    Swal.getHtmlContainer().querySelector('strong')
                        .textContent = (Swal.getTimerLeft() / 1000)
                        .toFixed(0)
                }, 100)
            },
            willClose: () => {
                clearInterval(redirectTimerInterval);
                navigate("/")
            }
        })
    }

    useEffect(() => {
        if(!isReservationTimerEnable) return;

        if(reservationTimer > 0){
            setTimeout(()=>{
                setReservationTimer(reservationTimer-1);
            }, 1000)
        }
        else {
            handleReserveTimeout()
        }
    }, [reservationTimer]);


    const handleReserveButtonClick = event => {

        event.currentTarget.disabled = true;
        setIsReservationTimerEnable(false);
        Swal.fire(
            'Reservation Completed!',
            'Car has been reserved for you!',
            'success'
        )

        const reservationData = {

            carBrand: carBrand,
            carModel: carModel,

            startDate: rentDate.start,
            endDate: rentDate.end,
            pickupLocation: selectedLocations.pickup,
            dropoffLocation: selectedLocations.dropoff
        }

        dispatch(makeReservation(reservationData));
    }

    return cars && brands && models !== null
    ?
        <div id="car-detail" style={{clear: "both"}}>
            <Container className="py-4">
                <Row className="mb-5">
                    <Col>
                        <h1 className="fs-1 text-center text-uppercase">Complete your reservation in <b>{timerToString()}</b></h1>
                    </Col>
                </Row>
                <Row className="mb-4">
                    <Col xs={12} md={6}>
                        <img src={cars[carId].image} alt={`${carBrand} / ${carModel}`} />
                    </Col>
                    <Col xs={12} md={6}>
                        <ListGroup variant="flush">
                            <ListGroup.Item variant="secondary" action>
                                <BsFillCarFrontFill size="2em" className="me-2" style={{marginTop: "-10px"}}/>
                                <span className="fs-6">Brand & Model:</span> &nbsp;
                                <span className="fs-5 fw-bold">{`${carBrand} / ${carModel}`}</span>
                            </ListGroup.Item>
                            <ListGroup.Item action>
                                <TbEngine size="2em" className="me-2" style={{marginTop: "-8px"}}/>
                                <span className="fs-6">HP:</span> &nbsp;
                                <span className="fs-5 fw-bold">{cars[carId].power}</span>
                            </ListGroup.Item>
                            <ListGroup.Item action>
                                <PiEngineFill size="2em" className="me-2" style={{marginTop: "-8px"}}/>
                                <span className="fs-6">Engine Size:</span> &nbsp;
                                <span className="fs-5 fw-bold">{cars[carId].engineSize}</span>
                            </ListGroup.Item>
                            <ListGroup.Item action>
                                <TbManualGearbox size="2em" className="me-2" style={{marginTop: "-8px"}}/>
                                <span className="fs-6">Gear Box:</span> &nbsp;
                                <span className="fs-5 fw-bold">{cars[carId].gearbox}</span>
                            </ListGroup.Item>
                            <ListGroup.Item action>
                                <BsCarFront size="2em" className="me-2" style={{marginTop: "-10px"}}/>
                                <span className="fs-6">Body Type:</span> &nbsp;
                                <span className="fs-5 fw-bold">{cars[carId].bodyType}</span>
                            </ListGroup.Item>
                            <ListGroup.Item action>
                                <BsFillFuelPumpFill size="2em" className="me-2" style={{marginTop: "-10px"}}/>
                                <span className="fs-6">Fuel Type:</span> &nbsp;
                                <span className="fs-5 fw-bold">{cars[carId].fuelType}</span>
                            </ListGroup.Item>
                        </ListGroup>
                    </Col>
                </Row>
                <Row>
                    <Col xs={12} md={6}>
                        <InputGroup size="lg" className="my-2">
                            <InputGroup.Text id="pick-up-locations">Pick-up Location</InputGroup.Text>
                            <Form.Select name="pick-up-locations" size="lg"
                                 onChange={e => {
                                     setSelectedLocations(prevState => ({
                                         ...prevState,
                                         pickup: e.target.value
                                     }));
                                 }}
                            >
                                {
                                    Object.entries(locations).map(([key, value]) =>
                                        <option key={key} value={key}>{value}</option>
                                    )
                                }
                            </Form.Select>
                        </InputGroup>
                    </Col>
                    <Col xs={12} md={6}>
                        <InputGroup size="lg" className="my-2">
                            <InputGroup.Text id="start-date">Start Date</InputGroup.Text>
                            <Form.Control
                                type="date"
                                min={getDateByInputFormat()}
                                name="start-date"
                                placeholder="Start Date"
                                value={rentDate.start}
                                onKeyDown={e => e.preventDefault()}
                                onChange={e => {
                                    setRentDate({
                                        start: e.target.value,
                                        end: getDateByInputFormat(1, e.target.value)
                                    })
                                }}
                            />
                        </InputGroup>
                    </Col>
                </Row>
                <Row>
                    <Col xs={12} md={6}>
                        <InputGroup size="lg" className="my-2">
                            <InputGroup.Text id="drop-off-locations">Drop-off Location</InputGroup.Text>
                            <Form.Select name="drop-off-locations" size="lg"
                                 onChange={e => {
                                     setSelectedLocations(prevState => ({
                                         ...prevState,
                                         dropoff: e.target.value
                                     }));
                                 }}
                            >
                                {
                                    Object.entries(locations).map(([key, value]) =>
                                        <option key={key} value={key}>{value}</option>
                                    )
                                }
                            </Form.Select>
                        </InputGroup>
                    </Col>
                    <Col xs={12} md={6}>
                        <InputGroup size="lg" className="my-2">
                            <InputGroup.Text id="end-date">End Date</InputGroup.Text>
                            <Form.Control
                                type="date"
                                min={getDateByInputFormat(1, rentDate.start)}
                                name="end-date"
                                placeholder="End Date"
                                value={rentDate.end}
                                onKeyDown={e => e.preventDefault()}
                                onChange={e => {
                                    setRentDate(prevState => ({
                                        ...prevState,
                                        end: e.target.value
                                    }));
                                }}
                            />
                        </InputGroup>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Button variant="success" size="lg" className="w-100 fs-4 fw-bold"
                        type="button"
                        onClick={handleReserveButtonClick}>
                            Reserve Now!
                        </Button>
                    </Col>
                </Row>
            </Container>
        </div>
    :
        <div className="text-center p-4">
            <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
            </Spinner>
        </div>
};

export default CarDetail;